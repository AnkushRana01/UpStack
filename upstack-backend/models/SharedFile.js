import mongoose from 'mongoose';

const sharedFileSchema = new mongoose.Schema(
  {
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    permission: { type: String, enum: ['view', 'download', 'edit'], default: 'view' },
    token: { type: String, index: true },
    expiresAt: { type: Date },
    isLink: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const SharedFile = mongoose.model('SharedFile', sharedFileSchema);
