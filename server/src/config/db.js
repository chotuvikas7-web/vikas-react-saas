import mysql from 'mysql2/promise';
import { env } from './env.js';

const pools = new Map();

export function databaseNameForTenant(slug) {
  if (!slug) return env.dbName;
  return env.tenantPrefix + String(slug).replaceAll('-', '_');
}

export function pool(database = env.dbName) {
  if (!pools.has(database)) {
    pools.set(database, mysql.createPool({
      host: env.dbHost,
      user: env.dbUser,
      password: env.dbPass,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true
    }));
  }
  return pools.get(database);
}

export const tenantDb = (database) => pool(database || env.dbName);
export const centralDb = () => pool(env.centralDbName);

export async function query(database, sql, params = []) {
  const [rows] = await pool(database).execute(sql, params);
  return rows;
}
