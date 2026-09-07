import multer from 'multer';
import { USER_STORAGE_LIMIT_BYTES } from '../services/storageLimitService.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: USER_STORAGE_LIMIT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname) {
      cb(new Error('Invalid file'));
      return;
    }
    cb(null, true);
  }
});
