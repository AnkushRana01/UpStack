import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload, uploadToS3 } from '../controllers/s3UploadController.js';

const router = express.Router();

// Protect the upload route so only authenticated users can use it.
router.post('/upload', protect, upload.single('file'), uploadToS3);

export default router;
