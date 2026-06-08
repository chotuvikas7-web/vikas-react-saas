import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { uploadsRoot } from '../utils/paths.js';

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = req.params.folder || 'general';
    const dir = path.join(uploadsRoot, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!allowed.has(file.mimetype)) return cb(new Error('Only image logo/favicon files are allowed.'));
    cb(null, true);
  }
});
