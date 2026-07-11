import express from 'express';
import { createFolder, deleteFile, downloadFile, listFiles, uploadFile } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', listFiles);
router.post('/folders', createFolder);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

export default router;
