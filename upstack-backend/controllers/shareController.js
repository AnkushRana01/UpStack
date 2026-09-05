import { nanoid } from 'nanoid';
import { File } from '../models/File.js';
import { SharedFile } from '../models/SharedFile.js';
import { User } from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { decryptBuffer } from '../services/encryptionService.js';
import { readObject } from '../services/storageService.js';

async function ownedFile(fileId, ownerId) {
  return File.findOne({ _id: fileId, owner: ownerId, isFolder: false });
}

export async function shareWithUser(req, res, next) {
  try {
    const file = await ownedFile(req.params.fileId, req.user._id);
    const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
    const recipient = await User.findOne({ email, isActive: true });

    if (!file || !recipient) {
      res.status(404);
      throw new Error('File or recipient not found');
    }

    if (String(recipient._id) === String(req.user._id)) {
      res.status(400);
      throw new Error('You already own this file');
    }

    // Only 'download' permission is supported. Reject any other permission.
    if (req.body.permission && req.body.permission !== 'download') {
      res.status(400);
      throw new Error("Invalid permission. Only 'download' permission is supported.");
    }

    // Upsert the share to guarantee 'download' permission without creating duplicates
    const share = await SharedFile.findOneAndUpdate(
      { file: file._id, sharedWith: recipient._id },
      {
        file: file._id,
        owner: req.user._id,
        sharedWith: recipient._id,
        permission: 'download'
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logActivity({ actor: req.user._id, action: 'FILE_SHARED_USER', targetType: 'share', targetId: share._id, ipAddress: req.ip });
    res.status(201).json({ share });
  } catch (error) {
    next(error);
  }
}

export async function createShareLink(req, res, next) {
  try {
    const file = await ownedFile(req.params.fileId, req.user._id);

    if (!file) {
      res.status(404);
      throw new Error('File not found');
    }

    if (req.body.permission && req.body.permission !== 'download') {
      res.status(400);
      throw new Error("Invalid permission. Only 'download' permission is supported.");
    }

    const share = await SharedFile.create({
      file: file._id,
      owner: req.user._id,
      permission: 'download',
      token: nanoid(32),
      expiresAt: req.body.expiresAt || null,
      isLink: true
    });

    await logActivity({ actor: req.user._id, action: 'FILE_SHARED_LINK', targetType: 'share', targetId: share._id, ipAddress: req.ip });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.status(201).json({ share, url: `${clientUrl}/share/${share.token}` });
  } catch (error) {
    next(error);
  }
}

export async function getSharedWithMe(req, res, next) {
  try {
    const shares = await SharedFile.find({ sharedWith: req.user._id }).populate('file owner', 'originalName size mimeType name email');
    res.json({ shares });
  } catch (error) {
    next(error);
  }
}

export async function downloadSharedWithMe(req, res, next) {
  try {
    const share = await SharedFile.findOne({ _id: req.params.shareId, sharedWith: req.user._id }).populate('file');

    if (!share) {
      res.status(404);
      throw new Error('Shared file not found');
    }

    if (share.permission !== 'download') {
      res.status(403);
      throw new Error("You don't have permission to download this file.");
    }

    const file = share.file;
    if (!file) {
      res.status(404);
      throw new Error('File not found or has been deleted');
    }

    if (!file.storageKey) {
      res.status(404);
      throw new Error('File storage information is missing. Unable to download this file.');
    }

    const rawBuffer = await readObject(file.storageKey);
    const fileBuffer = (file.iv && file.authTag)
      ? decryptBuffer(rawBuffer, file.iv, file.authTag)
      : rawBuffer;

    await logActivity({ actor: req.user._id, action: 'SHARED_FILE_DOWNLOADED', targetType: 'share', targetId: share._id, ipAddress: req.ip });
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
}

export async function getShareLink(req, res, next) {
  try {
    const share = await SharedFile.findOne({ token: req.params.token, isLink: true }).populate('file owner', 'originalName size mimeType name email');

    if (!share || (share.expiresAt && share.expiresAt < new Date())) {
      res.status(404);
      throw new Error('Share link expired or not found');
    }

    res.json({ share });
  } catch (error) {
    next(error);
  }
}

export async function downloadShareLink(req, res, next) {
  try {
    const share = await SharedFile.findOne({ token: req.params.token, isLink: true }).populate('file');

    if (!share || (share.expiresAt && share.expiresAt < new Date())) {
      res.status(404);
      throw new Error('Share link expired or not found');
    }

    if (share.permission !== 'download') {
      res.status(403);
      throw new Error("You don't have permission to download this file.");
    }

    const file = share.file;
    if (!file || !file.storageKey) {
      res.status(404);
      throw new Error('File not found or storage information missing');
    }

    const rawBuffer = await readObject(file.storageKey);
    const fileBuffer = (file.iv && file.authTag)
      ? decryptBuffer(rawBuffer, file.iv, file.authTag)
      : rawBuffer;

    await logActivity({ actor: share.owner, action: 'SHARE_LINK_DOWNLOADED', targetType: 'share', targetId: share._id, ipAddress: req.ip });
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
}
