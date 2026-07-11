import { ActivityLog } from '../models/ActivityLog.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';

export async function stats(_req, res, next) {
  try {
    const [users, files, storage, recent] = await Promise.all([
      User.countDocuments(),
      File.countDocuments({ isFolder: false }),
      File.aggregate([{ $match: { isFolder: false } }, { $group: { _id: null, total: { $sum: '$size' } } }]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).populate('actor', 'name email')
    ]);

    res.json({
      users,
      files,
      storageUsed: storage[0]?.total || 0,
      recentActivity: recent
    });
  } catch (error) {
    next(error);
  }
}

export async function users(_req, res, next) {
  try {
    res.json({ users: await User.find().sort({ createdAt: -1 }) });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role, isActive: req.body.isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function activity(_req, res, next) {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100).populate('actor', 'name email');
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}
