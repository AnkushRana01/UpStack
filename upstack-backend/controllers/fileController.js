import path from 'path';
import { nanoid } from 'nanoid';
import { File } from '../models/File.js';
import { SharedFile } from '../models/SharedFile.js';
import { User } from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { decryptBuffer, encryptBuffer } from '../services/encryptionService.js';
import { copyObject, deleteObject, readObject, saveObject, storageDriver } from '../services/storageService.js';

function sanitizeFileName(name) {
  return path.basename(name).replace(/[^\w.\-()\s]/g, '_');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fileQuery(userId, query) {
  const criteria = { owner: userId };

  const targetFolder = query.folder || (query.search ? null : 'root');

  if (targetFolder === 'root') {
    criteria.folder = null;
  } else if (targetFolder) {
    criteria.folder = targetFolder;
  }

  if (query.type) criteria.mimeType = new RegExp(escapeRegex(query.type), 'i');
  if (query.search) criteria.originalName = new RegExp(escapeRegex(query.search), 'i');

  return criteria;
}

async function assertFolderAccess(folderId, ownerId) {
  if (!folderId) return null;

  const folder = await File.findOne({ _id: folderId, owner: ownerId, isFolder: true });
  if (!folder) {
    const error = new Error('Folder not found');
    error.statusCode = 404;
    throw error;
  }

  return folder._id;
}

export async function listFiles(req, res, next) {
  try {
    const sortField = ['originalName', 'size', 'createdAt', 'mimeType'].includes(req.query.sort) ? req.query.sort : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const files = await File.find(fileQuery(req.user._id, req.query)).sort({ [sortField]: sortOrder });
    res.json({ files });
  } catch (error) {
    next(error);
  }
}

export async function createFolder(req, res, next) {
  try {
    if (!req.body.name || req.body.name.trim().length < 1) {
      res.status(400);
      throw new Error('Folder name is required');
    }

    const parentFolder = await assertFolderAccess(req.body.folder || null, req.user._id);
    const cleanName = sanitizeFileName(req.body.name);
    const folder = await File.create({
      owner: req.user._id,
      folder: parentFolder,
      originalName: cleanName,
      storedName: cleanName,
      mimeType: 'folder',
      storageDriver: storageDriver(),
      storageKey: `folders/${req.user._id}/${nanoid()}`,
      isFolder: true
    });

    await logActivity({ actor: req.user._id, action: 'FOLDER_CREATED', targetType: 'file', targetId: folder._id, ipAddress: req.ip });
    res.status(201).json({ file: folder });
  } catch (error) {
    next(error);
  }
}

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const cleanName = sanitizeFileName(req.file.originalname);
    const parentFolder = await assertFolderAccess(req.body.folder || null, req.user._id);
    const storedName = `${Date.now()}-${nanoid()}-${cleanName}.enc`;
    const storageKey = `primary/${req.user._id}/${storedName}`;
    const backupKey = `backup/${req.user._id}/${storedName}`;
    const encrypted = encryptBuffer(req.file.buffer);

    await saveObject(storageKey, encrypted.encrypted, req.file.mimetype);
    await copyObject(storageKey, backupKey);

    const file = await File.create({
      owner: req.user._id,
      folder: parentFolder,
      originalName: cleanName,
      storedName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageDriver: storageDriver(),
      storageKey,
      backupKey,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      checksum: encrypted.checksum
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: req.file.size } });
    await logActivity({
      actor: req.user._id,
      action: 'FILE_UPLOADED',
      targetType: 'file',
      targetId: file._id,
      metadata: { name: cleanName, size: req.file.size },
      ipAddress: req.ip
    });

    res.status(201).json({ file });
  } catch (error) {
    next(error);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.isFolder) {
      res.status(404);
      throw new Error('File not found');
    }

    // Check download authorization:
    // 1. Is the requesting user the owner of the file?
    const isOwner = file.owner.toString() === req.user._id.toString();

    // 2. Has the file been shared with the requesting user with 'download' permission?
    let isAuthorizedRecipient = false;
    if (!isOwner) {
      const share = await SharedFile.findOne({
        file: file._id,
        sharedWith: req.user._id,
        permission: 'download'
      });
      if (share) {
        isAuthorizedRecipient = true;
      }
    }

    if (!isOwner && !isAuthorizedRecipient) {
      res.status(403);
      throw new Error("You don't have permission to download this file.");
    }

    if (!file.storageKey) {
      res.status(404);
      throw new Error('File storage key not found');
    }

    const encrypted = await readObject(file.storageKey);
    const decrypted = (file.iv && file.authTag)
      ? decryptBuffer(encrypted, file.iv, file.authTag)
      : encrypted;

    await logActivity({
      actor: req.user._id,
      action: isOwner ? 'FILE_DOWNLOADED' : 'SHARED_FILE_DOWNLOADED',
      targetType: 'file',
      targetId: file._id,
      ipAddress: req.ip
    });

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(decrypted);
  } catch (error) {
    next(error);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      res.status(404);
      throw new Error('File not found');
    }

    if (file.isFolder) {
      const childCount = await File.countDocuments({ owner: req.user._id, folder: file._id });
      if (childCount > 0) {
        res.status(409);
        throw new Error('Folder must be empty before deletion');
      }
    }

    await deleteObject(file.storageKey);
    await deleteObject(file.backupKey);
    await File.deleteOne({ _id: file._id });
    if (!file.isFolder) await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: -file.size } });
    await logActivity({ actor: req.user._id, action: 'FILE_DELETED', targetType: 'file', targetId: file._id, ipAddress: req.ip });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
}
