import express from 'express';
import path from 'node:path';
import { upload } from '../middleware/upload.js';

export const uploadsRouter = express.Router();

uploadsRouter.post('/:folder', upload.single('file'), (req, res) => {
  const relative = `/uploads/${req.params.folder}/${path.basename(req.file.filename)}`;
  res.json({ path: relative, url: relative });
});
