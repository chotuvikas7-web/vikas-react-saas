import { centralDb, tenantDb } from '../config/db.js';

function contrast(hex = '#ffffff') {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return ((r * 299 + g * 587 + b * 114) / 1000) > 150 ? '#101828' : '#ffffff';
}

export function themeVars(meta = {}) {
  const primary = meta.primary_color || '#465dff';
  const header = meta.secondary_color || '#12b76a';
  const accent = meta.accent_color || '#f79009';
  const surface = meta.surface_color || '#f6f8fb';
  return {
    '--primary': primary,
    '--secondary': header,
    '--accent': accent,
    '--site-header-bg': header,
    '--site-footer-bg': header,
    '--sidebar-bg': header,
    '--primary-text': contrast(primary),
    '--secondary-text': contrast(header),
    '--site-header-text': contrast(header),
    '--site-footer-text': contrast(header),
    '--sidebar-text': contrast(header),
    '--accent-text': contrast(accent),
    '--surface-text': contrast(surface),
    '--super-font-family': meta.font_family || 'Inter, system-ui, sans-serif'
  };
}

export async function getActiveTheme() {
  try {
    const [rows] = await centralDb().execute(
      "SELECT * FROM platform_module_records WHERE module_key = 'themes' AND status = 'active' ORDER BY updated_at DESC, id DESC LIMIT 1"
    );
    const record = rows[0] || null;
    const metadata = record?.metadata ? JSON.parse(record.metadata) : {};
    return { record, metadata, vars: themeVars(metadata) };
  } catch {
    return { record: null, metadata: {}, vars: themeVars({}) };
  }
}

export async function getCompanySettings(database) {
  const [rows] = await tenantDb(database).execute('SELECT * FROM company_settings ORDER BY id LIMIT 1');
  return rows[0] || {};
}
