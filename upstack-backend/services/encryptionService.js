import crypto from 'crypto';

function getKey() {
  const configured = process.env.ENCRYPTION_KEY;
  if (configured && /^[a-f0-9]{64}$/i.test(configured)) {
    return Buffer.from(configured, 'hex');
  }

  return crypto.createHash('sha256').update(process.env.JWT_SECRET || 'development-key').digest();
}

export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    checksum: crypto.createHash('sha256').update(buffer).digest('hex')
  };
}

export function decryptBuffer(buffer, iv, authTag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}
