import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//used this website as an reference https://www.geeksforgeeks.org/node-js-crypto-createcipheriv-method/

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

