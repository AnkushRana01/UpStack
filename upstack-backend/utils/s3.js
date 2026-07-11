import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'path';

// Read and validate the AWS settings once before sending any request.
function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getS3Client() {
  const region = getRequiredEnv('AWS_REGION');
  const accessKeyId = getRequiredEnv('AWS_ACCESS_KEY_ID');
  const secretAccessKey = getRequiredEnv('AWS_SECRET_ACCESS_KEY');

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

// Build a safe S3 key while keeping the original file name visible.
export function buildS3Key(originalName, userId = 'anonymous') {
  const safeName = path.basename(originalName || 'file').replace(/\s+/g, '-');
  const timestamp = Date.now();
  return `uploads/${userId}/${timestamp}-${safeName}`;
}

// Upload a file buffer to S3 and return useful response data.
export async function uploadFileToS3(file, userId) {
  if (!file?.buffer) {
    throw new Error('No file content was provided.');
  }

  const bucket = getRequiredEnv('AWS_S3_BUCKET');
  const key = buildS3Key(file.originalname, userId);
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype || 'application/octet-stream',
    ServerSideEncryption: 'AES256'
  });

  await client.send(command);

  return {
    success: true,
    key,
    bucket,
    fileName: path.basename(key),
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size,
    location: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  };
}
