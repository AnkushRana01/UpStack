import express from 'express';
import { activity, stats, updateUser, users } from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/stats', stats);
router.get('/users', users);
router.patch('/users/:id', updateUser);
router.get('/activity', activity);

export default router;
