// const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { log } from 'console';
const ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // Use ENV variable in production
const encryptionKey = Buffer.from(ENCRYPTION_KEY, 'hex'); // Convert key to buffer
const ivLength = 16; // AES requires a 16-byte IV
const SALT_ROUNDS = 10; // For password hashing

// 🔐 **Encrypt User ID**
const encrypt = (text) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// 🔓 **Decrypt User ID**
const decrypt = (encryptedText) => {
  if (!encryptedText.includes(':')) throw new Error("Invalid encrypted text format");

  const [ivHex, encryptedData] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

// 🔑 **Generate JWT Token**
const generateToken = (id) => {
  const encryptedId = encrypt(id.toString()); // Encrypt user ID before adding to token
  return jwt.sign({ userId: encryptedId }, process.env.SECRET, { expiresIn: '1d' });
};

// 🔍 **Verify JWT Token**
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
     decoded.userId = decrypt(decoded.operatorId); // Decrypt user ID
    return decoded;
  } catch (error) {
    return null; // Invalid token
  }
};

// 🔒 **Hash Password**
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword; // ✅ Return the hashed password
};


// 🔑 **Verify Password**
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// 📌 **Export All Functions**
export { encrypt, decrypt, generateToken, verifyToken, hashPassword, verifyPassword };
