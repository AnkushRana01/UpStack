import express from 'express';
import { getActivity, login, me, register } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/activity', protect, getActivity);

export default router;
