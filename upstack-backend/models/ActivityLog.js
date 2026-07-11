import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetType: { type: String, enum: ['user', 'file', 'share', 'system'], default: 'system' },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: Object, default: {} },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1, actor: 1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
