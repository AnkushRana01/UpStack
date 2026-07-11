import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

// Validate that all required AWS environment variables are present
const requiredEnv = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.warn(`[UpStack S3] WARNING: Missing AWS environment variables: ${missingEnv.join(', ')}`);
}

// Instantiate and configure the S3 Client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Cache bucket name for easy reference
export const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * Uploads a file buffer directly to AWS S3 using PutObjectCommand.
 * 
 * @param {string} key - The destination key (path) inside the bucket.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimeType - The standard mimetype of the file.
 * @returns {Promise<any>} The S3 send response.
 */
export async function uploadToS3(key, buffer, mimeType) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('S3 Storage configuration error: AWS credentials are not set in the environment variables.');
  }

  if (!key || !buffer) {
    throw new Error('Upload error: Missing destination key or file buffer.');
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'application/octet-stream',
    ServerSideEncryption: 'AES256' // Enforces server-side AES-256 S3 encryption
  });

  return s3Client.send(command);
}

/**
 * Downloads a file buffer from AWS S3 using GetObjectCommand.
 * 
 * @param {string} key - The storage key of the target file.
 * @returns {Promise<Buffer>} The decrypted original file buffer.
 */
export async function getFromS3(key) {
  if (!key) {
    throw new Error('Download error: Storage key is required.');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  const response = await s3Client.send(command);
  // Transform the response stream to a byte array and convert it to a Node Buffer
  return Buffer.from(await response.Body.transformToByteArray());
}

/**
 * Deletes an object from AWS S3 using DeleteObjectCommand.
 * 
 * @param {string} key - The storage key of the target file.
 * @returns {Promise<any>} The S3 delete response.
 */
export async function deleteFromS3(key) {
  if (!key) return null;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  return s3Client.send(command);
}

/**
 * Replicates a file inside S3 (used for secondary backups) using CopyObjectCommand.
 * 
 * @param {string} sourceKey - The source file key path.
 * @param {string} destinationKey - The target destination backup key path.
 * @returns {Promise<any>} The S3 copy response.
 */
export async function copyInS3(sourceKey, destinationKey) {
  if (!sourceKey || !destinationKey) {
    throw new Error('Copy error: Source and destination keys are required.');
  }

  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey,
    ServerSideEncryption: 'AES256' // Enforces server-side encryption on the replica
  });

  return s3Client.send(command);
}
