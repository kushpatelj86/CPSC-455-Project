import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path and directory (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALGORITHM = 'aes-256-gcm'; // AES algorithm with Galois/Counter Mode
//generate key with "openssl rand -hex 32 > aes-key.pem"
// Path to the PEM key file (must contain a hex-encoded 32-byte key)
const keyPath = path.join(__dirname, 'aes-key.pem');

const hexKey = fs.readFileSync(keyPath, 'utf-8').trim();
const SYMMETRIC_KEY = Buffer.from(hexKey, 'hex');




// Encrypt Message
export function encrypt(message) {
  const iv = crypto.randomBytes(12); // 12 bytes is recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SYMMETRIC_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(message, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // Return as an object instead of colon-separated string
  const encryptedobject = {
    iv: iv.toString('hex'),
    ciphertext: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  };

  return encryptedobject
}

// Decrypt Message
export function decrypt(encryptedObject) {
  const iv = encryptedObject.iv;
  const ciphertext = encryptedObject.ciphertext;
  const authTag = encryptedObject.authTag;

  const ivBuf = Buffer.from(iv, 'hex');
  const encryptedBuf = Buffer.from(ciphertext, 'hex');
  const authTagBuf = Buffer.from(authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, SYMMETRIC_KEY, ivBuf);
  decipher.setAuthTag(authTagBuf);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuf),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}