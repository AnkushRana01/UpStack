import multer from 'multer';
import path from 'path';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { checkStorageLimits, USER_STORAGE_LIMIT_BYTES } from '../services/storageLimitService.js';
import { uploadFileToS3 } from '../utils/s3.js';

// Store uploads in memory so we do not write files to disk.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: USER_STORAGE_LIMIT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file?.originalname) {
      cb(new Error('Invalid file upload.'));
      return;
    }
    cb(null, true);
  }
});

function sanitizeFileName(name) {
  return path.basename(name || 'file').replace(/[^\w.\-()\s]/g, '_');
}

// Handle a single uploaded file from the request and send it to S3.
export async function uploadToS3(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was provided.' });
    }

    // Enforce 200 MB user limit and 5 GB organization limit before proceeding
    const newFileSize = req.file.size || 0;
    await checkStorageLimits(req.user._id, newFileSize);

    const userId = req.user?._id?.toString() || 'anonymous';
    const uploadResult = await uploadFileToS3(req.file, userId);
    const cleanName = sanitizeFileName(req.file.originalname);

    const fileRecord = await File.create({
      owner: req.user._id,
      folder: null,
      originalName: cleanName,
      storedName: uploadResult.fileName,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size || 0,
      storageDriver: 's3',
      storageKey: uploadResult.key,
      backupKey: null
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { storageUsed: req.file.size || 0 } });
    await logActivity({
      actor: req.user._id,
      action: 'FILE_UPLOADED',
      targetType: 'file',
      targetId: fileRecord._id,
      metadata: { name: cleanName, size: req.file.size || 0, storage: 's3' },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully to S3.',
      file: {
        ...uploadResult,
        record: fileRecord
      }
    });
  } catch (error) {
    if (error.message.includes('Missing required environment variable')) {
      return res.status(500).json({ success: false, message: 'AWS S3 is not configured correctly.' });
    }

    if (error.message.includes('No file content')) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty.' });
    }

    return next(error);
  }
}
