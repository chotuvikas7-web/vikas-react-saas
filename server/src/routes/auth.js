import bcrypt from 'bcryptjs';
import express from 'express';
import { centralDb, databaseNameForTenant, tenantDb } from '../config/db.js';
import { signUser } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = express.Router();

function databaseUnavailable(error) {
  return ['ECONNREFUSED', 'ER_BAD_DB_ERROR', 'PROTOCOL_CONNECTION_LOST'].includes(error?.code);
}

authRouter.post('/admin/login', asyncHandler(async (req, res) => {
  const { email, password, tenant } = req.body;
  let database = databaseNameForTenant(tenant);
  if (tenant) {
    try {
      const [tenantRows] = await centralDb().execute('SELECT database_name FROM tenants WHERE slug = ? LIMIT 1', [tenant]);
      database = tenantRows[0]?.database_name || database;
    } catch {
      database = databaseNameForTenant(tenant);
    }
  }
  const [rows] = await tenantDb(database).execute('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
  const admin = rows[0];
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).json({ message: 'Invalid admin email or password.' });
  }
  const token = signUser({ id: admin.id, name: admin.name, email: admin.email, role: 'admin', database, tenant });
  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin', database } });
}));

authRouter.post('/super-admin/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let rows = [];
  try {
    [rows] = await centralDb().execute("SELECT * FROM super_admins WHERE email = ? AND status = 'active' LIMIT 1", [email]);
  } catch (error) {
    if (databaseUnavailable(error)) {
      return res.status(503).json({ message: 'Database server is not running. Please start XAMPP MySQL and try again.' });
    }
    throw error;
  }
  const admin = rows[0];
  if (!admin || !bcrypt.compareSync(password || '', admin.password_hash)) {
    return res.status(401).json({ message: 'Invalid super admin email or password.' });
  }
  const token = signUser({ id: admin.id, name: admin.name, email: admin.email, role: 'super-admin' });
  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'super-admin' } });
}));

authRouter.get('/me', (req, res) => {
  res.json({ user: null });
});
