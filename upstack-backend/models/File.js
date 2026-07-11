import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    originalName: { type: String, required: true, trim: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    storageDriver: { type: String, enum: ['local', 's3'], default: 'local' },
    storageKey: { type: String, required: true },
    backupKey: { type: String },
    iv: { type: String },
    authTag: { type: String },
    checksum: { type: String },
    isFolder: { type: Boolean, default: false }
  },
  { timestamps: true }
);

fileSchema.index({ owner: 1, originalName: 'text', mimeType: 1, createdAt: -1 });

export const File = mongoose.model('File', fileSchema);
