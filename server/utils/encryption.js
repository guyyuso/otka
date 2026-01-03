import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.APP_SECRET || 'default-dev-secret-key-32-chars!!';
// Ensure secret is 32 bytes. If not, we might need hashing, but for now assuming valid key or padding.
// For robust prod, use a proper key management. Here strictly simple.

const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export const encrypt = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), content: encrypted };
};

export const decrypt = (hash) => {
    if (!hash || !hash.iv || !hash.content) return null;
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(hash.iv, 'hex'));
    let decrypted = decipher.update(hash.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};
