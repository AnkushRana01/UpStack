import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname) {
      cb(new Error('Invalid file'));
      return;
    }
    cb(null, true);
  }
});
