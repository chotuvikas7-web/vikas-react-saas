import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4100),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  dbHost: process.env.DB_HOST || 'localhost',
  dbUser: process.env.DB_USER || 'root',
  dbPass: process.env.DB_PASS || '',
  dbName: process.env.DB_NAME || 'vikas_electronics',
  centralDbName: process.env.CENTRAL_DB_NAME || 'vikas_erp_master',
  tenantPrefix: process.env.TENANT_DB_PREFIX || 'erp_tenant_',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  uploadDir: process.env.UPLOAD_DIR || '../uploads'
};
