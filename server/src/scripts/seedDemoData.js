import { centralDb, tenantDb } from '../config/db.js';

const tenantDatabase = 'vikas_electronics';

async function one(db, sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows[0] || null;
}

async function ensureCategory(db, name, slug) {
  const existing = await one(db, 'SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]);
  if (existing) return existing.id;
  const [result] = await db.execute('INSERT INTO categories (name, slug, status) VALUES (?, ?, "active")', [name, slug]);
  return result.insertId;
}

async function ensureClient(db, client) {
  const existing = await one(db, 'SELECT id FROM clients WHERE mobile = ? LIMIT 1', [client.mobile]);
  if (existing) return existing.id;
  const [result] = await db.execute(
    'INSERT INTO clients (name, mobile, email, address, state, gst_number, opening_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")',
    [client.name, client.mobile, client.email, client.address, client.state, client.gst_number, client.opening_balance]
  );
  return result.insertId;
}

async function ensureSupplier(db, supplier) {
  const existing = await one(db, 'SELECT id FROM suppliers WHERE mobile = ? LIMIT 1', [supplier.mobile]);
  if (existing) return existing.id;
  const [result] = await db.execute(
    'INSERT INTO suppliers (name, mobile, email, address, state, gst_number, opening_balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, "active")',
    [supplier.name, supplier.mobile, supplier.email, supplier.address, supplier.state, supplier.gst_number, supplier.opening_balance]
  );
  return result.insertId;
}

async function ensureProduct(db, product, categoryId) {
  const existing = await one(db, 'SELECT id FROM products WHERE sku = ? LIMIT 1', [product.sku]);
  if (existing) return existing.id;
  const [result] = await db.execute(
    'INSERT INTO products (category_id, name, slug, sku, cost, price, gst_rate, min_stock, stock_quantity, description, specifications, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [categoryId, product.name, product.slug, product.sku, product.cost, product.price, product.gst_rate, product.min_stock, product.stock_quantity, product.description, product.specifications]
  );
  if (product.stock_quantity > 0) {
    await db.execute(
      'INSERT INTO stock_ledger (product_id, movement_date, movement_type, quantity, balance_after, note) VALUES (?, "2026-05-01", "added", ?, ?, "Demo opening stock")',
      [result.insertId, product.stock_quantity, product.stock_quantity]
    );
  }
  return result.insertId;
}

async function seedTenantErp() {
  const db = tenantDb(tenantDatabase);
  const categories = {
    jhatka: await ensureCategory(db, 'Jhatka Machines', 'jhatka-machines'),
    transformer: await ensureCategory(db, 'Jhatka Machine Transformer', 'jhatka-machine-transformer'),
    chargers: await ensureCategory(db, 'Battery Chargers', 'battery-chargers'),
    pcb: await ensureCategory(db, 'PCB Cards', 'pcb-cards'),
    components: await ensureCategory(db, 'Electronic Components', 'electronic-components'),
    spares: await ensureCategory(db, 'Spare Parts', 'spare-parts')
  };

  const products = [
    ['Jhatka Machine Deluxe 12V', 'jhatka-machine-deluxe-12v', 'DEMO-JM-12V', categories.jhatka, 1550, 2799, 8, 42, 'Heavy duty 12V jhatka machine for agriculture fencing.'],
    ['Jhatka Machine Transformer Copper', 'jhatka-machine-transformer-copper', 'DEMO-TR-CU', categories.transformer, 540, 950, 10, 65, 'Copper winding transformer for jhatka machine assembly.'],
    ['Automatic Battery Charger 12V', 'automatic-battery-charger-12v', 'DEMO-BC-12V', categories.chargers, 390, 799, 12, 58, 'Automatic 12V battery charger with overload protection.'],
    ['Jhatka Machine Control Card', 'jhatka-machine-control-card', 'DEMO-JC-CTRL', categories.pcb, 310, 690, 15, 80, 'Replacement control card for jhatka machines.'],
    ['AC PCB Card Industrial', 'ac-pcb-card-industrial', 'DEMO-ACPCB', categories.pcb, 430, 899, 6, 24, 'AC control PCB card for electronics repair and production.'],
    ['Low Stock Demo PCB Card', 'low-stock-demo-pcb-card', 'DEMO-LOW-PCB', categories.pcb, 220, 499, 10, 3, 'Low stock demo item for alert testing.'],
    ['Spare Output Connector Set', 'spare-output-connector-set', 'DEMO-SP-CONN', categories.spares, 35, 90, 40, 220, 'Connector spare set for jhatka machine repair.']
  ];
  for (const [name, slug, sku, categoryId, cost, price, min_stock, stock_quantity, description] of products) {
    await ensureProduct(db, { name, slug, sku, cost, price, gst_rate: 18, min_stock, stock_quantity, description, specifications: 'Demo technical specifications' }, categoryId);
  }

  await ensureClient(db, { name: 'Agro Power Traders', mobile: '9000011111', email: 'agro@example.com', address: 'Kanpur Road, Lucknow', state: 'Uttar Pradesh', gst_number: '09AGROP1234F1Z1', opening_balance: 2500 });
  await ensureClient(db, { name: 'Farm Shield Dealers', mobile: '9000022222', email: 'farm@example.com', address: 'MI Road, Jaipur', state: 'Rajasthan', gst_number: '08FARMS1234F1Z2', opening_balance: 0 });
  await ensureClient(db, { name: 'Rural Electronics Mart', mobile: '9000033333', email: 'rural@example.com', address: 'Civil Lines, Prayagraj', state: 'Uttar Pradesh', gst_number: '09RURAL1234F1Z3', opening_balance: 1200 });

  await ensureSupplier(db, { name: 'Shree PCB Components', mobile: '9111111111', email: 'pcb-supplier@example.com', address: 'Lajpat Rai Market, Delhi', state: 'Delhi', gst_number: '07PCBSP1234F1Z4', opening_balance: 5000 });
  await ensureSupplier(db, { name: 'Copper Coil Industries', mobile: '9222222222', email: 'copper@example.com', address: 'Industrial Area, Ghaziabad', state: 'Uttar Pradesh', gst_number: '09COPPR1234F1Z5', opening_balance: 0 });
  await ensureSupplier(db, { name: 'Battery Parts House', mobile: '9333333333', email: 'battery@example.com', address: 'Transport Nagar, Lucknow', state: 'Uttar Pradesh', gst_number: '09BATTP1234F1Z6', opening_balance: 1800 });
}

async function ensurePlan(db, plan) {
  const existing = await one(db, 'SELECT id FROM saas_plans WHERE slug = ? LIMIT 1', [plan.slug]);
  if (existing) return existing.id;
  const [result] = await db.execute(
    'INSERT INTO saas_plans (name, slug, monthly_price, annual_price, user_limit, storage_limit_mb, module_access, feature_limits, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "active")',
    [plan.name, plan.slug, plan.monthly, plan.annual, plan.users, plan.storage, JSON.stringify(plan.modules), JSON.stringify(plan.limits)]
  );
  return result.insertId;
}

async function ensureTenant(db, tenant) {
  const existing = await one(db, 'SELECT id FROM tenants WHERE slug = ? LIMIT 1', [tenant.slug]);
  if (existing) {
    await db.execute('UPDATE tenants SET owner_name=?, owner_email=?, phone=?, plan_id=?, trial_starts_at=?, trial_ends_at=?, subscription_ends_at=?, storage_used_mb=?, status=? WHERE id=?', [tenant.owner, tenant.email, tenant.phone, tenant.plan_id, tenant.trial_start, tenant.trial_end, tenant.subscription_end, tenant.storage, tenant.status, existing.id]);
    return existing.id;
  }
  const [result] = await db.execute(
    'INSERT INTO tenants (company_name, slug, database_name, owner_name, owner_email, phone, plan_id, trial_starts_at, trial_ends_at, subscription_ends_at, storage_used_mb, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tenant.company, tenant.slug, tenant.database, tenant.owner, tenant.email, tenant.phone, tenant.plan_id, tenant.trial_start, tenant.trial_end, tenant.subscription_end, tenant.storage, tenant.status]
  );
  return result.insertId;
}

async function ensureModuleRecord(db, module_key, title, status, metadata = {}, amount = null, due_date = null) {
  const existing = await one(db, 'SELECT id FROM platform_module_records WHERE module_key = ? AND title = ? LIMIT 1', [module_key, title]);
  if (existing) return existing.id;
  const [result] = await db.execute(
    'INSERT INTO platform_module_records (module_key, title, status, amount, due_date, description, metadata, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
    [module_key, title, status, amount, due_date, metadata.description || 'Demo module record', JSON.stringify(metadata)]
  );
  return result.insertId;
}

async function seedSuperAdmin() {
  const db = centralDb();
  const free = await ensurePlan(db, { name: 'Free Plan', slug: 'free', monthly: 0, annual: 0, users: 2, storage: 512, modules: { erp: true, inventory: true }, limits: { invoices: 25 } });
  const starter = await ensurePlan(db, { name: 'Starter Plan', slug: 'starter', monthly: 999, annual: 9990, users: 5, storage: 2048, modules: { erp: true, accounting: true, inventory: true }, limits: { invoices: 250 } });
  const business = await ensurePlan(db, { name: 'Business Plan', slug: 'business', monthly: 2499, annual: 24990, users: 20, storage: 10240, modules: { erp: true, accounting: true, inventory: true, manufacturing: true }, limits: { invoices: 2000 } });
  const enterprise = await ensurePlan(db, { name: 'Enterprise Plan', slug: 'enterprise', monthly: 7999, annual: 79990, users: null, storage: null, modules: { all: true }, limits: { invoices: 'unlimited' } });

  const mainTenant = await ensureTenant(db, { company: 'Vikas Electronics Manufacture Company', slug: 'vikas-electronics', database: 'vikas_electronics', owner: 'Admin', email: 'admin@vikaselectronics.local', phone: '9000000000', plan_id: business, trial_start: '2026-05-01', trial_end: '2026-05-15', subscription_end: '2027-05-15', storage: 784.5, status: 'active' });
  const trialTenant = await ensureTenant(db, { company: 'Agro Demo ERP', slug: 'agro-demo-erp', database: 'erp_tenant_agro_demo_erp', owner: 'Ravi Sharma', email: 'ravi@agrodemo.local', phone: '9011111111', plan_id: starter, trial_start: '2026-05-20', trial_end: '2026-06-05', subscription_end: '2026-06-05', storage: 215.25, status: 'trial' });
  const suspendedTenant = await ensureTenant(db, { company: 'Rural Supply Suspended', slug: 'rural-supply-suspended', database: 'erp_tenant_rural_supply_suspended', owner: 'Neha Singh', email: 'neha@ruralsupply.local', phone: '9022222222', plan_id: free, trial_start: '2026-03-01', trial_end: '2026-03-15', subscription_end: '2026-04-15', storage: 96.1, status: 'suspended' });

  const subExisting = await one(db, 'SELECT id FROM saas_subscriptions WHERE tenant_id = ? AND plan_id = ? LIMIT 1', [mainTenant, business]);
  const subscriptionId = subExisting?.id || (await db.execute('INSERT INTO saas_subscriptions (tenant_id, plan_id, status, billing_cycle, amount, started_at, renews_at, ends_at) VALUES (?, ?, "active", "annual", 24990, "2026-05-15", "2027-05-15", "2027-05-15")', [mainTenant, business]))[0].insertId;
  if (!(await one(db, 'SELECT id FROM saas_subscriptions WHERE tenant_id = ? AND plan_id = ? LIMIT 1', [trialTenant, starter]))) {
    await db.execute('INSERT INTO saas_subscriptions (tenant_id, plan_id, status, billing_cycle, amount, started_at, renews_at, ends_at) VALUES (?, ?, "trial", "monthly", 999, "2026-05-20", "2026-06-05", "2026-06-05")', [trialTenant, starter]);
  }
  if (!(await one(db, 'SELECT id FROM saas_subscriptions WHERE tenant_id = ? AND plan_id = ? LIMIT 1', [suspendedTenant, free]))) {
    await db.execute('INSERT INTO saas_subscriptions (tenant_id, plan_id, status, billing_cycle, amount, started_at, renews_at, ends_at) VALUES (?, ?, "cancelled", "monthly", 0, "2026-03-01", "2026-04-01", "2026-04-15")', [suspendedTenant, free]);
  }

  const payment = await one(db, 'SELECT id FROM saas_payments WHERE invoice_no = "SAAS-INV-2026-001" LIMIT 1');
  if (!payment) {
    await db.execute('INSERT INTO saas_payments (tenant_id, subscription_id, invoice_no, amount, payment_status, payment_gateway, transaction_ref, paid_at) VALUES (?, ?, "SAAS-INV-2026-001", 24990, "paid", "Razorpay", "pay_demo_1001", "2026-05-15 10:30:00")', [mainTenant, subscriptionId]);
    await db.execute('INSERT INTO saas_payments (tenant_id, subscription_id, invoice_no, amount, payment_status, payment_gateway, transaction_ref, paid_at) VALUES (?, NULL, "SAAS-INV-2026-002", 999, "pending", "Stripe", "pi_demo_2002", NULL)', [trialTenant]);
    await db.execute('INSERT INTO saas_payments (tenant_id, subscription_id, invoice_no, amount, payment_status, payment_gateway, transaction_ref, paid_at) VALUES (?, NULL, "SAAS-INV-2026-003", 2499, "failed", "PayPal", "pp_demo_3003", NULL)', [suspendedTenant]);
  }

  const ticket = await one(db, 'SELECT id FROM support_tickets WHERE subject = "Invoice download issue" LIMIT 1');
  if (!ticket) {
    await db.execute('INSERT INTO support_tickets (tenant_id, category, subject, priority, status, assigned_to) VALUES (?, "Billing", "Invoice download issue", "high", "open", "Musharof")', [mainTenant]);
    await db.execute('INSERT INTO support_tickets (tenant_id, category, subject, priority, status, assigned_to) VALUES (?, "Technical", "SMTP test mail not sending", "medium", "pending", "Lindsey Curtis")', [trialTenant]);
    await db.execute('INSERT INTO support_tickets (tenant_id, category, subject, priority, status, assigned_to) VALUES (?, "Account", "Reactivate suspended company", "urgent", "resolved", "Kaiya George")', [suspendedTenant]);
  }

  for (const integration of [
    ['Razorpay', 'Payment Gateway', 'active'],
    ['Stripe', 'Payment Gateway', 'testing'],
    ['PayPal', 'Payment Gateway', 'inactive'],
    ['Twilio SMS', 'SMS Gateway', 'active'],
    ['Gmail SMTP', 'Email SMTP', 'testing'],
    ['WhatsApp Cloud API', 'WhatsApp API', 'active'],
    ['Google Maps', 'Google Services', 'active'],
    ['Tenant Webhook', 'Webhooks', 'testing']
  ]) {
    await db.execute('INSERT INTO platform_integrations (provider, category, status, settings) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE category=VALUES(category), status=VALUES(status), settings=VALUES(settings)', [integration[0], integration[1], integration[2], JSON.stringify({ mode: 'demo', configured: integration[2] === 'active' })]);
  }

  for (const job of [
    ['Nightly Backup', 'success', 'Backup completed for 3 tenants', '2026-06-01 02:00:00', '2026-06-01 02:12:00'],
    ['Queue Health Check', 'running', 'Processing 14 queued notifications', '2026-06-02 09:00:00', null],
    ['Cache Clear', 'queued', 'Awaiting scheduled cache clear', null, null],
    ['Database Monitoring', 'success', 'All tenant schemas reachable', '2026-06-02 08:00:00', '2026-06-02 08:02:00']
  ]) {
    const existing = await one(db, 'SELECT id FROM maintenance_jobs WHERE job_type = ? LIMIT 1', [job[0]]);
    if (!existing) await db.execute('INSERT INTO maintenance_jobs (job_type, status, message, started_at, finished_at) VALUES (?, ?, ?, ?, ?)', job);
  }

  await ensureModuleRecord(db, 'upgrade-requests', 'Vikas Electronics upgrade to Enterprise', 'pending', { owner: 'admin@vikaselectronics.local', reference: 'Business -> Enterprise', description: 'Customer requested more user seats and storage.' }, 79990, '2026-06-10');
  await ensureModuleRecord(db, 'downgrade-requests', 'Agro Demo downgrade review', 'review', { owner: 'ravi@agrodemo.local', reference: 'Starter -> Free', description: 'Tenant asked to reduce cost after trial.' }, 0, '2026-06-05');
  await ensureModuleRecord(db, 'vendor-verification', 'Shree PCB Components verification', 'approved', { owner: 'compliance@vikaserp.local', reference: 'KYC-2026-001' });
  await ensureModuleRecord(db, 'user-activity', 'Admin exported sales report', 'active', { owner: 'admin@vikaselectronics.local', reference: 'IP 127.0.0.1' });
  await ensureModuleRecord(db, 'platform-audit-logs', 'Theme color changed', 'active', { owner: 'Super Admin', reference: 'themes' });
}

await seedTenantErp();
await seedSuperAdmin();
console.log('Demo data seeded for Admin and Super Admin.');
process.exit(0);
