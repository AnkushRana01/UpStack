import mongoose from 'mongoose';
import { File } from '../models/File.js';

export const USER_STORAGE_LIMIT_BYTES =
  parseInt(process.env.USER_STORAGE_LIMIT_BYTES, 10) || 200 * 1024 * 1024; // 200 MB

export const ORG_STORAGE_LIMIT_BYTES =
  parseInt(process.env.ORG_STORAGE_LIMIT_BYTES, 10) || 5 * 1024 * 1024 * 1024; // 5 GB

/**
 * Validates that an upload of newFileSize will not exceed the user or organization storage limits.
 * Throws an Error with statusCode 400 and user-specified messages if any limit is exceeded.
 *
 * @param {string|Object} userId
 * @param {number} newFileSize
 */
export async function checkStorageLimits(userId, newFileSize = 0) {
  const ownerObjectId =
    userId instanceof mongoose.Types.ObjectId
      ? userId
      : new mongoose.Types.ObjectId(String(userId));

  // 1. Calculate user's current storage usage dynamically from files
  const userStorageAggr = await File.aggregate([
    { $match: { owner: ownerObjectId, isFolder: false } },
    { $group: { _id: null, total: { $sum: '$size' } } }
  ]);
  const userCurrentStorage = userStorageAggr[0]?.total || 0;

  // 2. Calculate organization's total storage usage dynamically from files
  const orgStorageAggr = await File.aggregate([
    { $match: { isFolder: false } },
    { $group: { _id: null, total: { $sum: '$size' } } }
  ]);
  const orgCurrentStorage = orgStorageAggr[0]?.total || 0;

  // 3. Verify user has not already reached limit
  if (userCurrentStorage >= USER_STORAGE_LIMIT_BYTES) {
    const error = new Error('Upload failed: You have reached your 200 MB storage limit.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Verify file does not exceed remaining user storage
  if (userCurrentStorage + newFileSize > USER_STORAGE_LIMIT_BYTES) {
    const error = new Error('Upload failed: This file exceeds your remaining storage.');
    error.statusCode = 400;
    throw error;
  }

  // 5. Verify file does not exceed organization 5 GB limit
  if (
    orgCurrentStorage >= ORG_STORAGE_LIMIT_BYTES ||
    orgCurrentStorage + newFileSize > ORG_STORAGE_LIMIT_BYTES
  ) {
    const error = new Error('Upload failed: The organization has reached its 5 GB storage limit.');
    error.statusCode = 400;
    throw error;
  }

  return {
    userCurrentStorage,
    orgCurrentStorage,
    userRemaining: Math.max(0, USER_STORAGE_LIMIT_BYTES - userCurrentStorage),
    orgRemaining: Math.max(0, ORG_STORAGE_LIMIT_BYTES - orgCurrentStorage)
  };
}
