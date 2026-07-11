import { uploadToS3, getFromS3, deleteFromS3, copyInS3 } from './s3.js';

// Re-route legacy storage service functions directly to S3 integration
export const saveObject = uploadToS3;
export const readObject = getFromS3;
export const deleteObject = deleteFromS3;
export const copyObject = copyInS3;

/**
 * Returns the current active storage driver (exclusively S3).
 * 
 * @returns {string} The active storage driver.
 */
export function storageDriver() {
  return 's3';
}
