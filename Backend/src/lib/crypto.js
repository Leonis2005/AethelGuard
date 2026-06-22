const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getVaultEncryptionKey() {
  const key = process.env.VAULT_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('VAULT_ENCRYPTION_KEY is not configured');
  }

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('VAULT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  return keyBuffer;
}

function encryptVaultPayload(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getVaultEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedPayload: Buffer.concat([encrypted, authTag]).toString('base64'),
    encryptionIv: iv.toString('hex'),
  };
}

function decryptVaultPayload(encryptedPayload, encryptionIv) {
  const payloadBuffer = Buffer.from(encryptedPayload, 'base64');
  const authTag = payloadBuffer.subarray(payloadBuffer.length - 16);
  const encrypted = payloadBuffer.subarray(0, payloadBuffer.length - 16);
  const iv = Buffer.from(encryptionIv, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getVaultEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = {
  encryptVaultPayload,
  decryptVaultPayload,
};
