import express from 'express';
import { centralDb, tenantDb } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adminModules, superModules } from '../services/moduleConfig.js';
import { getActiveTheme } from '../services/themeService.js';

export const superAdminRouter = express.Router();

superAdminRouter.use(requireAuth, requireRole('super-admin'));

const planModules = ['plans', 'features', 'feature-limits', 'pricing-rules', 'coupons', 'plan-free', 'plan-starter', 'plan-business', 'plan-enterprise', 'module-access', 'custom-pricing'];
const subscriptionModules = ['active-subscriptions', 'trial-subscriptions', 'expired-subscriptions', 'renewals', 'upgrade-requests', 'downgrade-requests', 'cancelled-subscriptions'];
const billingModules = ['subscription-payments', 'billing-invoices', 'transactions', 'refunds', 'failed-payments', 'revenue-reports'];
const supportModules = ['support-tickets', 'ticket-categories', 'ticket-assignment', 'ticket-assignments', 'live-chat', 'live-chat-requests', 'contact-requests', 'knowledge-base'];
const integrationModules = ['payment-gateways', 'sms-gateway', 'email-smtp', 'whatsapp-api', 'google-services', 'webhooks', 'api-keys', 'razorpay', 'stripe', 'paypal'];
const maintenanceModules = ['backup-management', 'restore-management', 'database-monitoring', 'queue-monitoring', 'cron-jobs', 'cache-management', 'system-updates', 'system-update', 'error-logs'];
const tenantModules = ['overview', 'all-companies', 'company-details', 'company-status', 'company-requests', 'company-request', 'suspended-companies', 'suspend-company', 'company-usage', 'company-storage', 'vendor-list'];

function sourceForModule(module) {
  if (planModules.includes(module)) return 'plans';
  if (subscriptionModules.includes(module)) return 'subscriptions';
  if (billingModules.includes(module)) return 'billing';
  if (supportModules.includes(module)) return 'support';
  if (integrationModules.includes(module)) return 'integrations';
  if (maintenanceModules.includes(module)) return 'maintenance';
  if (tenantModules.includes(module)) return 'tenants';
  return 'records';
}

function normalizePayment(row) {
  return {
    ...row,
    title: row.invoice_no || row.transaction_ref || `Payment #${row.id}`,
    status: row.payment_status,
    reference: row.transaction_ref || row.payment_gateway,
    owner: row.company_name || 'Platform'
  };
}

function normalizeTenant(row) {
  return {
    ...row,
    title: row.company_name,
    owner: row.owner_name || row.owner_email,
    reference: row.slug
  };
}

async function ensureMailMessages(db, context = 'super', ownerId = 1, recipient = 'super@vikaserp.local') {
  await db.execute(`CREATE TABLE IF NOT EXISTS mail_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    context VARCHAR(40) NOT NULL DEFAULT 'admin',
    owner_id INT NULL,
    folder VARCHAR(30) NOT NULL DEFAULT 'inbox',
    sender_name VARCHAR(140) NULL,
    sender_email VARCHAR(180) NULL,
    recipient_email VARCHAR(180) NULL,
    subject VARCHAR(220) NOT NULL,
    body MEDIUMTEXT NULL,
    category VARCHAR(80) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'unread',
    is_starred TINYINT(1) NOT NULL DEFAULT 0,
    attachments JSON NULL,
    sent_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX (context),
    INDEX (owner_id),
    INDEX (folder),
    INDEX (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const [[count]] = await db.execute('SELECT COUNT(*) AS total FROM mail_messages WHERE context = ? AND (owner_id <=> ?)', [context, ownerId]);
  if (count.total > 0) return;
  const samples = [
    ['Platform Alerts', 'alerts@vikaserp.local', 'Tenant storage and subscription summary', 'System', 'unread', 'inbox'],
    ['Billing Desk', 'billing@vikaserp.local', 'Monthly SaaS payment report', 'Billing', 'read', 'inbox'],
    ['Support Desk', 'support@vikaserp.local', 'Urgent ticket escalation queue', 'Support', 'unread', 'inbox'],
    ['Security Monitor', 'security@vikaserp.local', 'Login audit digest is ready', 'Security', 'read', 'archive'],
    ['Vikas ERP', 'no-reply@vikaserp.local', 'Platform activity digest', 'System', 'read', 'inbox']
  ];
  for (const [sender, email, subject, category, status, folder] of samples) {
    await db.execute(
      'INSERT INTO mail_messages (context, owner_id, folder, sender_name, sender_email, recipient_email, subject, body, category, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))',
      [context, ownerId, folder, sender, email, recipient, subject, `Hello,\n\nThis message is available in your Super Admin mailbox. Use reply, forward, archive and trash actions from this screen.\n\nRegards,\n${sender}`, category, status, samples.indexOf(samples.find((item) => item[2] === subject)) + 1]
    );
  }
}

async function firstRow(db, sql, params = [], fallback = {}) {
  try {
    const [rows] = await db.execute(sql, params);
    return rows[0] || fallback;
  } catch (error) {
    console.warn(`Super admin query skipped: ${error.message}`);
    return fallback;
  }
}

async function allRows(db, sql, params = []) {
  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn(`Super admin query skipped: ${error.message}`);
    return [];
  }
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'company';
}

async function columnsFor(db, table) {
  const [rows] = await db.execute(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function tenantPayload(db, body = {}, id = null) {
  const cols = await columnsFor(db, 'tenants');
  const name = String(body.company_name || body.record_title || body.title || '').trim();
  if (!name) {
    const error = new Error('Company name is required.');
    error.statusCode = 422;
    throw error;
  }
  const slug = String(body.slug || body.reference || slugify(name)).trim();
  const payload = {
    company_name: name,
    owner_name: body.owner_name || body.owner || '',
    owner_email: body.owner_email || body.email || '',
    owner_phone: body.owner_phone || body.phone || '',
    phone: body.phone || body.owner_phone || '',
    website: body.website || '',
    slug,
    plan_id: body.plan_id || body.plan || null,
    storage_used_mb: Number(body.storage_used_mb || body.storage || 0),
    status: body.status || 'active',
    subscription_ends_at: body.subscription_ends_at || body.due_date || null
  };
  if (body.database_name || !id) {
    payload.database_name = body.database_name || `tenant_${slugify(slug)}_${Date.now()}`;
  }
  return Object.fromEntries(Object.entries(payload).filter(([key]) => cols.has(key)));
}

async function tenantReferences(db) {
  const [rows] = await db.execute(
    `SELECT TABLE_NAME, COLUMN_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND REFERENCED_TABLE_NAME = 'tenants'
       AND REFERENCED_COLUMN_NAME = 'id'`
  );
  return rows;
}

async function deleteTenantDependencies(db, tenantId) {
  const knownOrder = [
    ['saas_payments', 'tenant_id'],
    ['support_tickets', 'tenant_id'],
    ['saas_subscriptions', 'tenant_id']
  ];
  const deleted = new Set();
  for (const [table, column] of knownOrder) {
    const cols = await columnsFor(db, table);
    if (cols.has(column)) {
      await db.execute(`DELETE FROM \`${table}\` WHERE \`${column}\`=?`, [tenantId]);
      deleted.add(`${table}.${column}`);
    }
  }
  for (const row of await tenantReferences(db)) {
    const key = `${row.TABLE_NAME}.${row.COLUMN_NAME}`;
    if (deleted.has(key)) continue;
    await db.execute(`DELETE FROM \`${row.TABLE_NAME}\` WHERE \`${row.COLUMN_NAME}\`=?`, [tenantId]);
  }
}

const money = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

superAdminRouter.get('/email', asyncHandler(async (req, res) => {
  const db = centralDb();
  await ensureMailMessages(db, 'super', req.user.id, req.user.email);
  const folder = String(req.query.folder || 'inbox').replace(/[^a-z]/g, '') || 'inbox';
  const q = `%${req.query.q || ''}%`;
  const [countRows] = await db.execute("SELECT folder, COUNT(*) AS total, SUM(status = 'unread') AS unread FROM mail_messages WHERE context = 'super' AND (owner_id <=> ?) GROUP BY folder", [req.user.id]);
  const [messages] = await db.execute(
    "SELECT * FROM mail_messages WHERE context = 'super' AND (owner_id <=> ?) AND folder = ? AND (subject LIKE ? OR sender_name LIKE ? OR sender_email LIKE ? OR body LIKE ?) ORDER BY COALESCE(sent_at, created_at) DESC, id DESC LIMIT 160",
    [req.user.id, folder, q, q, q, q]
  );
  let selected = null;
  if (req.query.mail) {
    const [[row]] = await db.execute("SELECT * FROM mail_messages WHERE id=? AND context='super' AND (owner_id <=> ?) LIMIT 1", [req.query.mail, req.user.id]);
    selected = row || null;
    if (selected) await db.execute("UPDATE mail_messages SET status='read' WHERE id=?", [selected.id]);
  }
  res.json({ folder, counts: countRows, messages, selected });
}));

superAdminRouter.post('/email', asyncHandler(async (req, res) => {
  const db = centralDb();
  await ensureMailMessages(db, 'super', req.user.id, req.user.email);
  const action = req.body.mail_action || req.body.action || 'compose';
  if (action === 'compose') {
    await db.execute(
      'INSERT INTO mail_messages (context, owner_id, folder, sender_name, sender_email, recipient_email, subject, body, category, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['super', req.user.id, req.body.save_as === 'draft' ? 'drafts' : 'sent', 'Super Admin', req.user.email, req.body.recipient_email, req.body.subject, req.body.body || '', 'Manual', 'read', req.body.save_as === 'draft' ? null : new Date()]
    );
    return res.json({ message: req.body.save_as === 'draft' ? 'Draft saved.' : 'Email saved in Sent.' });
  }
  const id = Number(req.body.id);
  if (action === 'star') await db.execute("UPDATE mail_messages SET is_starred = 1 - is_starred WHERE id=? AND context='super' AND (owner_id <=> ?)", [id, req.user.id]);
  if (action === 'read') await db.execute("UPDATE mail_messages SET status = IF(status='read','unread','read') WHERE id=? AND context='super' AND (owner_id <=> ?)", [id, req.user.id]);
  if (['archive', 'trash', 'spam'].includes(action)) await db.execute("UPDATE mail_messages SET folder=? WHERE id=? AND context='super' AND (owner_id <=> ?)", [action === 'trash' ? 'trash' : action, id, req.user.id]);
  if (action === 'delete') await db.execute("DELETE FROM mail_messages WHERE id=? AND context='super' AND (owner_id <=> ?)", [id, req.user.id]);
  res.json({ message: 'Updated.' });
}));

superAdminRouter.get('/dashboard', asyncHandler(async (req, res) => {
  const db = centralDb();
  const tenantStats = await firstRow(db, `SELECT
    COUNT(*) AS total,
    SUM(status = 'active') AS active,
    SUM(status = 'inactive') AS inactive,
    SUM(status = 'trial') AS trial,
    SUM(status = 'suspended') AS suspended,
    COALESCE(SUM(storage_used_mb),0) AS storage_mb
    FROM tenants`, [], { total: 0, active: 0, inactive: 0, trial: 0, suspended: 0, storage_mb: 0 });

  let totalUsers = 0;
  const tenantDatabases = await allRows(db, 'SELECT database_name FROM tenants');
  await Promise.all(tenantDatabases.map(async (tenant) => {
    if (!tenant.database_name) return;
    try {
      const count = await firstRow(tenantDb(tenant.database_name), 'SELECT COUNT(*) AS total FROM users', [], { total: 0 });
      totalUsers += Number(count.total || 0);
    } catch {
      // Some demo tenants may not have been migrated yet.
    }
  }));

  const billing = await firstRow(db, `SELECT
    COALESCE(SUM(CASE WHEN payment_status = 'paid' AND paid_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') THEN amount ELSE 0 END),0) AS monthly_revenue,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' AND YEAR(paid_at) = YEAR(CURRENT_DATE) THEN amount ELSE 0 END),0) AS annual_revenue,
    SUM(payment_status = 'failed') AS failed_payments
    FROM saas_payments`, [], { monthly_revenue: 0, annual_revenue: 0, failed_payments: 0 });
  const pendingPayments = await firstRow(db, "SELECT COUNT(*) AS total FROM saas_payments WHERE payment_status = 'pending'", [], { total: 0 });
  const subscription = await firstRow(db, `SELECT
    SUM(status = 'active') AS active,
    SUM(status = 'trial') AS trial,
    SUM(status = 'expired') AS expired,
    SUM(renews_at BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY)) AS renewals
    FROM saas_subscriptions`, [], { active: 0, trial: 0, expired: 0, renewals: 0 });
  const tickets = await firstRow(db, `SELECT
    COUNT(*) AS total,
    SUM(status = 'open') AS open,
    SUM(priority IN ('high','urgent') AND status <> 'closed') AS urgent
    FROM support_tickets`, [], { total: 0, open: 0, urgent: 0 });
  const pendingTickets = await firstRow(db, "SELECT COUNT(*) AS total FROM support_tickets WHERE status = 'pending'", [], { total: 0 });
  const resolvedTickets = await firstRow(db, "SELECT COUNT(*) AS total FROM support_tickets WHERE status = 'resolved'", [], { total: 0 });
  const closedTickets = await firstRow(db, "SELECT COUNT(*) AS total FROM support_tickets WHERE status = 'closed'", [], { total: 0 });

  const [recentTenants, recentPayments, recentTickets, expiringSubscriptions, failedPayments, plans] = await Promise.all([
    allRows(db, 'SELECT * FROM tenants ORDER BY id DESC LIMIT 6'),
    allRows(db, 'SELECT p.*, t.company_name FROM saas_payments p LEFT JOIN tenants t ON t.id = p.tenant_id ORDER BY p.id DESC LIMIT 6'),
    allRows(db, 'SELECT s.*, t.company_name FROM support_tickets s LEFT JOIN tenants t ON t.id = s.tenant_id ORDER BY s.id DESC LIMIT 6'),
    allRows(db, 'SELECT s.*, t.company_name, p.name AS plan_name FROM saas_subscriptions s LEFT JOIN tenants t ON t.id = s.tenant_id LEFT JOIN saas_plans p ON p.id = s.plan_id WHERE s.renews_at BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) ORDER BY s.renews_at LIMIT 6'),
    allRows(db, "SELECT p.*, t.company_name FROM saas_payments p LEFT JOIN tenants t ON t.id = p.tenant_id WHERE p.payment_status = 'failed' ORDER BY p.id DESC LIMIT 6"),
    allRows(db, 'SELECT p.name, COUNT(s.id) AS total FROM saas_plans p LEFT JOIN saas_subscriptions s ON s.plan_id = p.id GROUP BY p.id, p.name ORDER BY p.id')
  ]);

  const chartData = {
    revenueLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    revenue: [0, 0, 0, 0, Number(billing.monthly_revenue || 0), Number(billing.annual_revenue || 0)],
    companyGrowth: [1, Math.max(1, Number(tenantStats.total || 0) - 3), Math.max(1, Number(tenantStats.total || 0) - 2), Math.max(1, Number(tenantStats.total || 0) - 1), Number(tenantStats.total || 0), Number(tenantStats.total || 0)],
    userGrowth: [1, Math.max(1, totalUsers - 4), Math.max(1, totalUsers - 3), Math.max(1, totalUsers - 2), Math.max(1, totalUsers - 1), totalUsers],
    planLabels: plans.map((row) => row.name),
    planCounts: plans.map((row) => Number(row.total || 0)),
    supportLabels: ['Open', 'Pending', 'Resolved', 'Closed'],
    supportCounts: [Number(tickets.open || 0), Number(pendingTickets.total || 0), Number(resolvedTickets.total || 0), Number(closedTickets.total || 0)],
    churn: [1.2, 1.6, 1.1, 2.0, 1.4, Math.max(0.4, Number(subscription.expired || 0))]
  };

  const cards = [
    ['Total Companies', tenantStats.total || 0, 'bi-buildings', 'primary'],
    ['Active Companies', tenantStats.active || 0, 'bi-check-circle', 'success'],
    ['Inactive Companies', tenantStats.inactive || 0, 'bi-pause-circle', 'muted'],
    ['Trial Companies', tenantStats.trial || 0, 'bi-hourglass-split', 'warning'],
    ['Suspended Companies', tenantStats.suspended || 0, 'bi-slash-circle', 'danger'],
    ['Total Users', totalUsers, 'bi-people', 'primary'],
    ['Active Users', totalUsers, 'bi-person-check', 'success'],
    ['Monthly Revenue', money(billing.monthly_revenue), 'bi-currency-rupee', 'success'],
    ['Annual Revenue', money(billing.annual_revenue), 'bi-graph-up-arrow', 'success'],
    ['Pending Payments', pendingPayments.total || 0, 'bi-hourglass-bottom', 'warning'],
    ['Renewals', subscription.renewals || 0, 'bi-calendar2-check', 'warning'],
    ['Expiring Plans', subscription.expired || 0, 'bi-exclamation-circle', 'danger'],
    ['Open Tickets', tickets.open || 0, 'bi-ticket-detailed', 'danger'],
    ['System Health', '99.9%', 'bi-heart-pulse', 'success'],
    ['Database Usage', `${Number(tenantStats.storage_mb || 0).toFixed(1)} MB`, 'bi-database-check', 'primary'],
    ['Storage Usage', `${Number(tenantStats.storage_mb || 0).toFixed(1)} MB`, 'bi-hdd', 'primary']
  ];

  res.json({
    metrics: Object.fromEntries(cards.map(([label, value]) => [label, value])),
    cards,
    chartData,
    recentTenants,
    recentPayments,
    recentTickets,
    expiringSubscriptions,
    failedPayments,
    adminModules,
    superModules
  });
}));

superAdminRouter.get('/tenants', asyncHandler(async (req, res) => {
  const [rows] = await centralDb().execute('SELECT * FROM tenants ORDER BY id DESC LIMIT 100');
  res.json({ rows });
}));

superAdminRouter.get('/theme', asyncHandler(async (req, res) => {
  res.json(await getActiveTheme());
}));

superAdminRouter.get('/modules/:module', asyncHandler(async (req, res) => {
  const db = centralDb();
  const module = req.params.module;
  const source = sourceForModule(module);
  let rows = [];

  if (source === 'plans') {
    [rows] = await db.execute('SELECT *, name AS title, slug AS reference FROM saas_plans ORDER BY id DESC LIMIT 100');
  } else if (source === 'subscriptions') {
    [rows] = await db.execute(`
      SELECT s.*, t.company_name, p.name AS plan_name, t.owner_email,
        CONCAT(t.company_name, ' - ', p.name) AS title,
        t.company_name AS owner,
        s.billing_cycle AS reference
      FROM saas_subscriptions s
      LEFT JOIN tenants t ON t.id = s.tenant_id
      LEFT JOIN saas_plans p ON p.id = s.plan_id
      ORDER BY s.id DESC
      LIMIT 100
    `);
  } else if (source === 'billing') {
    const [paymentRows] = await db.execute(`
      SELECT p.*, t.company_name
      FROM saas_payments p
      LEFT JOIN tenants t ON t.id = p.tenant_id
      ORDER BY p.id DESC
      LIMIT 100
    `);
    rows = paymentRows.map(normalizePayment);
  } else if (source === 'support') {
    [rows] = await db.execute(`
      SELECT st.*, t.company_name, st.subject AS title, st.assigned_to AS owner, st.category AS reference
      FROM support_tickets st
      LEFT JOIN tenants t ON t.id = st.tenant_id
      ORDER BY st.id DESC
      LIMIT 100
    `);
  } else if (source === 'integrations') {
    [rows] = await db.execute('SELECT *, provider AS title, category AS reference FROM platform_integrations ORDER BY updated_at DESC, id DESC LIMIT 100');
  } else if (source === 'maintenance') {
    [rows] = await db.execute('SELECT *, job_type AS title, message AS description, status AS reference FROM maintenance_jobs ORDER BY id DESC LIMIT 100');
  } else if (source === 'tenants') {
    const [tenantRows] = await db.execute('SELECT * FROM tenants ORDER BY id DESC LIMIT 100');
    rows = tenantRows.map(normalizeTenant);
  }

  const [customRows] = await db.execute('SELECT *, JSON_EXTRACT(metadata, "$.owner") AS owner, JSON_EXTRACT(metadata, "$.reference") AS reference FROM platform_module_records WHERE module_key = ? ORDER BY id DESC LIMIT 100', [module]);
  res.json({ rows: [...customRows, ...rows], source });
}));

superAdminRouter.post('/modules/:module', asyncHandler(async (req, res) => {
  const db = centralDb();
  if (sourceForModule(req.params.module) === 'tenants') {
    const payload = await tenantPayload(db, req.body);
    const keys = Object.keys(payload);
    await db.execute(
      `INSERT INTO tenants (${keys.map((key) => `\`${key}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
      keys.map((key) => payload[key])
    );
    return res.json({ message: 'Company saved.' });
  }
  const metadata = JSON.stringify(req.body.metadata || {});
  await db.execute(
    'INSERT INTO platform_module_records (module_key, title, status, description, metadata, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [req.params.module, req.body.title, req.body.status || 'active', req.body.description || '', metadata, req.user.id]
  );
  res.json({ message: 'Saved.' });
}));

superAdminRouter.put('/modules/:module/:id', asyncHandler(async (req, res) => {
  const db = centralDb();
  if (sourceForModule(req.params.module) === 'tenants') {
    const payload = await tenantPayload(db, req.body, req.params.id);
    const keys = Object.keys(payload);
    await db.execute(
      `UPDATE tenants SET ${keys.map((key) => `\`${key}\`=?`).join(', ')} WHERE id=?`,
      [...keys.map((key) => payload[key]), req.params.id]
    );
    return res.json({ message: 'Company updated.' });
  }
  const metadata = JSON.stringify(req.body.metadata || {});
  await db.execute(
    'UPDATE platform_module_records SET title=?, status=?, description=?, metadata=? WHERE id=? AND module_key=?',
    [req.body.title, req.body.status || 'active', req.body.description || '', metadata, req.params.id, req.params.module]
  );
  res.json({ message: 'Updated.' });
}));

superAdminRouter.delete('/modules/:module/:id', asyncHandler(async (req, res) => {
  const db = centralDb();
  if (sourceForModule(req.params.module) === 'tenants') {
    await deleteTenantDependencies(db, req.params.id);
    await db.execute('DELETE FROM tenants WHERE id=?', [req.params.id]);
    return res.json({ message: 'Company deleted.' });
  }
  await db.execute('DELETE FROM platform_module_records WHERE id=? AND module_key=?', [req.params.id, req.params.module]);
  res.json({ message: 'Deleted.' });
}));
