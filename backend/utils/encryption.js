/**
 * Encryption Utility
 * Encrypts/decrypts sensitive data like connection credentials
 */

const crypto = require('crypto');
const config = require('../config/environment');

// Use first 32 characters of JWT secret as encryption key
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(config.jwtSecret)
  .digest('base64')
  .substr(0, 32);

const IV_LENGTH = 16;  // For AES, this is always 16

/**
 * Encrypt text
 */
exports.encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypt text
 */
exports.decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
};