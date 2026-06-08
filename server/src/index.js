import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env.js';
import { uploadsRoot } from './utils/paths.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { superAdminRouter } from './routes/superAdmin.js';
import { uploadsRouter } from './routes/uploads.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'vikas-electronics-node-react' }));
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/super-admin', superAdminRouter);
app.use('/api/uploads', uploadsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error.' });
});

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}/api`);
});
