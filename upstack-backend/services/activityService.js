import { ActivityLog } from '../models/ActivityLog.js';

export function logActivity({ actor, action, targetType, targetId, metadata = {}, ipAddress }) {
  return ActivityLog.create({ actor, action, targetType, targetId, metadata, ipAddress }).catch(() => null);
}
