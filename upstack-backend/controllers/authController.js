import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { logActivity } from '../services/activityService.js';
import { generateToken } from '../services/tokenService.js';

function authResponse(user) {
  return {
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      storageUsed: user.storageUsed
    }
  };
}

function assertCredentials({ email, password }) {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || name.trim().length < 2) {
      res.status(400);
      throw new Error('Name must be at least 2 characters');
    }
    assertCredentials({ email, password });

    const exists = await User.findOne({ email });

    if (exists) {
      res.status(409);
      throw new Error('Email already registered');
    }

    const firstUser = (await User.countDocuments()) === 0;
    const user = await User.create({ name, email, password, role: firstUser ? 'admin' : 'user' });
    await logActivity({ actor: user._id, action: 'USER_REGISTERED', targetType: 'user', targetId: user._id, ipAddress: req.ip });
    res.status(201).json(authResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    assertCredentials({ email, password });

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password)) || !user.isActive) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    await logActivity({ actor: user._id, action: 'USER_LOGIN', targetType: 'user', targetId: user._id, ipAddress: req.ip });
    res.json(authResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function getActivity(req, res, next) {
  try {
    const logs = await ActivityLog.find({
      actor: req.user._id,
      action: { $in: ['FILE_UPLOADED', 'FOLDER_CREATED'] }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('actor', 'name email');
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}
