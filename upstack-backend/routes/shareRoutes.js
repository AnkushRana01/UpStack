import express from 'express';
import { createShareLink, downloadShareLink, downloadSharedWithMe, getShareLink, getSharedWithMe, shareWithUser } from '../controllers/shareController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/link/:token', getShareLink);
router.get('/link/:token/download', downloadShareLink);
router.use(protect);
router.get('/me', getSharedWithMe);
router.get('/me/:shareId/download', downloadSharedWithMe);
router.post('/:fileId/user', shareWithUser);
router.post('/:fileId/link', createShareLink);

export default router;
