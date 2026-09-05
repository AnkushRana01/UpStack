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
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      res.status(404);
      throw new Error('User not found');
    }

    const { role, isActive, newAdminId } = req.body;

    // ── Safety: prevent any operation that would leave zero active admins ─────
    //
    // An operation "removes" an admin when:
    //   • The target is currently an admin, AND
    //   • We are either suspending them (isActive = false) OR demoting them (role ≠ 'admin')
    const willRemoveAdmin =
      targetUser.role === 'admin' &&
      (isActive === false || (role !== undefined && role !== 'admin'));

    if (willRemoveAdmin) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });

      if (activeAdminCount <= 1) {
        // This is the last active admin — a replacement must be provided
        if (!newAdminId) {
          res.status(400);
          throw new Error(
            'At least one admin must remain active. Supply a newAdminId to transfer the admin role before this action.'
          );
        }

        // ── Validate the replacement ────────────────────────────────────────
        const newAdmin = await User.findById(newAdminId);

        if (!newAdmin) {
          res.status(404);
          throw new Error('Replacement admin user not found.');
        }

        if (newAdmin._id.toString() === targetUser._id.toString()) {
          res.status(400);
          throw new Error('The replacement admin must be a different user from the one being updated.');
        }

        // Only active users can receive the admin role (requirement §6)
        if (!newAdmin.isActive) {
          res.status(400);
          throw new Error('The selected replacement admin account is suspended. Choose an active user.');
        }

        // ── Atomically transfer the admin role first ─────────────────────────
        // Transfer BEFORE suspending/demoting the current admin so the system
        // never momentarily reaches zero admins.
        await User.findByIdAndUpdate(
          newAdminId,
          { role: 'admin' },
          { runValidators: true }
        );
        // If this update throws, the catch block returns an error and the
        // target user is NOT modified — the system stays consistent.
      }
    }

    // ── Apply the requested changes to the target user ───────────────────────
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
}

export async function activity(_req, res, next) {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actor', 'name email');
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}
