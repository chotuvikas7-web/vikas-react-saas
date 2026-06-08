import express from 'express';
import { tenantDb } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminRouter = express.Router();

adminRouter.use(requireAuth, requireRole('admin'));

const tableMap = {
  products: 'products',
  categories: 'categories',
  clients: 'clients',
  customers: 'clients',
  suppliers: 'suppliers',
  orders: 'orders',
  invoices: 'sales_invoices',
  sales: 'sales_invoices',
  purchases: 'purchases',
  expenses: 'expenses',
  earnings: 'earnings',
  payments: 'payments',
  users: 'users',
  stock: 'stock_ledger',
  ledgers: 'accounting_ledgers',
  'ledger-master': 'accounting_ledgers',
  vouchers: 'accounting_vouchers',
  enquiries: 'enquiries',
  gst: 'gst_rates'
};

const today = () => new Date().toISOString().slice(0, 10);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

async function columnsFor(db, table) {
  const [rows] = await db.execute(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function ensureModuleRecords(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS app_module_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_key VARCHAR(100) NOT NULL,
    title VARCHAR(180) NOT NULL,
    owner VARCHAR(160) NULL,
    reference VARCHAR(160) NULL,
    status VARCHAR(40) DEFAULT 'active',
    description TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX(module_key)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function ensureErpModuleRecords(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS erp_module_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_key VARCHAR(120) NOT NULL,
    title VARCHAR(180) NOT NULL,
    reference_no VARCHAR(120) NULL,
    party_name VARCHAR(160) NULL,
    amount DECIMAL(12,2) NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    due_date DATE NULL,
    description TEXT NULL,
    metadata JSON NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX (module_key),
    INDEX (status),
    INDEX (due_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function ensureMailMessages(db) {
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
  const [[count]] = await db.execute('SELECT COUNT(*) AS total FROM mail_messages WHERE context = ? AND (owner_id <=> ?)', ['admin', 1]);
  if (count.total > 0) return;
  const samples = [
    ['Search Console', 'alerts@google.com', 'Index coverage summary for your workspace', 'Social', 'unread', 'inbox'],
    ['PayPal', 'service@paypal.com', 'Payment settlement report is available', 'Billing', 'read', 'inbox'],
    ['Google Meet', 'meet@google.com', 'Meeting notes and recording link', 'Team', 'read', 'inbox'],
    ['Vikas ERP', 'no-reply@vikaserp.local', 'Monthly platform activity digest', 'System', 'unread', 'inbox'],
    ['Support Desk', 'support@vikaserp.local', 'Ticket escalation update', 'Support', 'read', 'archive']
  ];
  for (const [sender, email, subject, category, status, folder] of samples) {
    await db.execute(
      'INSERT INTO mail_messages (context, owner_id, folder, sender_name, sender_email, recipient_email, subject, body, category, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))',
      ['admin', 1, folder, sender, email, 'admin@vikaserp.local', subject, `Hello,\n\nThis message is available in your ERP mailbox. Use reply, forward, archive and trash actions from this screen.\n\nRegards,\n${sender}`, category, status, samples.indexOf(samples.find((item) => item[2] === subject)) + 1]
    );
  }
}

async function sumBetween(db, table, dateColumn, amountColumn, from, to) {
  try {
    const [[row]] = await db.execute(`SELECT COALESCE(SUM(${amountColumn}),0) AS total FROM \`${table}\` WHERE \`${dateColumn}\` BETWEEN ? AND ?`, [from, to]);
    return Number(row.total || 0);
  } catch {
    return 0;
  }
}

async function scalar(db, sql, fallback = 0) {
  try {
    const [[row]] = await db.execute(sql);
    return Number(Object.values(row || {})[0] || fallback);
  } catch {
    return fallback;
  }
}

function moneyString(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function paymentBadge(status) {
  const key = String(status || '').toLowerCase();
  if (key === 'paid' || key === 'completed') return 'success';
  if (key === 'partial') return 'warning';
  if (key === 'pending' || key === 'unpaid') return 'danger';
  return 'secondary';
}

function titleCase(value) {
  return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
}

adminRouter.get('/dashboard', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const now = new Date();
  const date = (value) => value.toISOString().slice(0, 10);
  const todayDate = date(now);
  const monthStart = date(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = date(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const metrics = {
    clients: await scalar(db, "SELECT COUNT(*) FROM clients WHERE status = 'active'"),
    suppliers: await scalar(db, "SELECT COUNT(*) FROM suppliers WHERE status = 'active'"),
    products: await scalar(db, "SELECT COUNT(*) FROM products WHERE status = 'active'"),
    orders: await scalar(db, 'SELECT COUNT(*) FROM orders'),
    sales: await scalar(db, 'SELECT COALESCE(SUM(grand_total),0) FROM sales_invoices'),
    purchases: await scalar(db, 'SELECT COALESCE(SUM(grand_total),0) FROM purchases'),
    expenses: await scalar(db, 'SELECT COALESCE(SUM(amount),0) FROM expenses'),
    low_stock: await scalar(db, "SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock AND status = 'active'"),
    today_expense: await sumBetween(db, 'expenses', 'expense_date', 'amount', todayDate, todayDate),
    today_earning: await sumBetween(db, 'earnings', 'earning_date', 'amount', todayDate, todayDate),
    month_expense: await sumBetween(db, 'expenses', 'expense_date', 'amount', monthStart, monthEnd),
    month_earning: await sumBetween(db, 'earnings', 'earning_date', 'amount', monthStart, monthEnd),
    pending_client: await scalar(db, 'SELECT COALESCE(SUM(due_amount),0) FROM sales_invoices'),
    pending_supplier: await scalar(db, 'SELECT COALESCE(SUM(due_amount),0) FROM purchases'),
    today_sales: await sumBetween(db, 'sales_invoices', 'invoice_date', 'grand_total', todayDate, todayDate),
    today_purchase: await sumBetween(db, 'purchases', 'purchase_date', 'grand_total', todayDate, todayDate),
    cash_balance: await scalar(db, "SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE -amount END),0) FROM cash_bank_ledger WHERE account_type='Cash'"),
    bank_balance: await scalar(db, "SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount ELSE -amount END),0) FROM cash_bank_ledger WHERE account_type='Bank'")
  };
  let recentOrders = [];
  let lowStock = [];
  let topProducts = [];
  try {
    [recentOrders] = await db.execute('SELECT o.*, c.name AS client_name FROM orders o JOIN clients c ON c.id = o.client_id ORDER BY o.id DESC LIMIT 6');
  } catch {}
  try {
    [lowStock] = await db.execute("SELECT * FROM products WHERE stock_quantity <= min_stock AND status = 'active' ORDER BY stock_quantity ASC LIMIT 8");
  } catch {}
  try {
    [topProducts] = await db.execute('SELECT p.name, COALESCE(SUM(i.quantity),0) AS qty FROM sales_invoice_items i JOIN products p ON p.id = i.product_id GROUP BY p.id, p.name ORDER BY qty DESC LIMIT 6');
  } catch {}
  const trendLabels = [];
  const salesTrend = [];
  const purchaseTrend = [];
  const expenseTrend = [];
  const earningTrend = [];
  const paymentModeMap = new Map();
  const addPaymentRows = async (sql, key) => {
    try {
      const [rows] = await db.execute(sql);
      rows.forEach((row) => {
        const mode = String(row.payment_mode || 'Other').trim() || 'Other';
        const current = paymentModeMap.get(mode) || { incoming: 0, outgoing: 0 };
        current[key] += Number(row.amount || 0);
        paymentModeMap.set(mode, current);
      });
    } catch {}
  };
  await addPaymentRows('SELECT payment_mode, COALESCE(SUM(amount),0) AS amount FROM earnings GROUP BY payment_mode', 'incoming');
  await addPaymentRows("SELECT method AS payment_mode, COALESCE(SUM(amount),0) AS amount FROM payments WHERE payment_type = 'client_received' GROUP BY method", 'incoming');
  await addPaymentRows('SELECT payment_mode, COALESCE(SUM(amount),0) AS amount FROM expenses GROUP BY payment_mode', 'outgoing');
  await addPaymentRows("SELECT method AS payment_mode, COALESCE(SUM(amount),0) AS amount FROM payments WHERE payment_type = 'supplier_paid' GROUP BY method", 'outgoing');
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const value = date(day);
    trendLabels.push(day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    salesTrend.push(await sumBetween(db, 'sales_invoices', 'invoice_date', 'grand_total', value, value));
    purchaseTrend.push(await sumBetween(db, 'purchases', 'purchase_date', 'grand_total', value, value));
    expenseTrend.push(await sumBetween(db, 'expenses', 'expense_date', 'amount', value, value));
    earningTrend.push(await sumBetween(db, 'earnings', 'earning_date', 'amount', value, value));
  }
  const paymentModeRows = Array.from(paymentModeMap.entries()).map(([payment_mode, row]) => ({ payment_mode, ...row }));
  res.json({
    metrics,
    recentOrders,
    lowStock,
    chartData: {
      trendLabels,
      salesTrend,
      purchaseTrend,
      expenseTrend,
      earningTrend,
      paymentModeLabels: paymentModeRows.map((row) => row.payment_mode),
      paymentModeIncoming: paymentModeRows.map((row) => row.incoming),
      paymentModeOutgoing: paymentModeRows.map((row) => row.outgoing),
      profitBreakdown: {
        'Monthly Earning': Number(metrics.month_earning || 0),
        'Monthly Expense': Number(metrics.month_expense || 0),
        Sales: Number(metrics.sales || 0),
        Purchase: Number(metrics.purchases || 0)
      },
      topProducts
    }
  });
}));

adminRouter.get('/email', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureMailMessages(db);
  const folder = String(req.query.folder || 'inbox').replace(/[^a-z]/g, '') || 'inbox';
  const q = `%${req.query.q || ''}%`;
  const [countRows] = await db.execute("SELECT folder, COUNT(*) AS total, SUM(status = 'unread') AS unread FROM mail_messages WHERE context = 'admin' GROUP BY folder");
  const [messages] = await db.execute(
    "SELECT * FROM mail_messages WHERE context = 'admin' AND folder = ? AND (subject LIKE ? OR sender_name LIKE ? OR sender_email LIKE ? OR body LIKE ?) ORDER BY COALESCE(sent_at, created_at) DESC, id DESC LIMIT 160",
    [folder, q, q, q, q]
  );
  let selected = null;
  if (req.query.mail) {
    const [[row]] = await db.execute("SELECT * FROM mail_messages WHERE id=? AND context='admin' LIMIT 1", [req.query.mail]);
    selected = row || null;
    if (selected) await db.execute("UPDATE mail_messages SET status='read' WHERE id=?", [selected.id]);
  }
  res.json({ folder, counts: countRows, messages, selected });
}));

adminRouter.post('/email', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureMailMessages(db);
  const action = req.body.mail_action || req.body.action || 'compose';
  if (action === 'compose') {
    await db.execute(
      'INSERT INTO mail_messages (context, owner_id, folder, sender_name, sender_email, recipient_email, subject, body, category, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['admin', req.user.id, req.body.save_as === 'draft' ? 'drafts' : 'sent', 'Admin', req.user.email, req.body.recipient_email, req.body.subject, req.body.body || '', 'Manual', 'read', req.body.save_as === 'draft' ? null : new Date()]
    );
    return res.json({ message: req.body.save_as === 'draft' ? 'Draft saved.' : 'Email saved in Sent.' });
  }
  const id = Number(req.body.id);
  if (action === 'star') await db.execute('UPDATE mail_messages SET is_starred = 1 - is_starred WHERE id=?', [id]);
  if (action === 'read') await db.execute("UPDATE mail_messages SET status = IF(status='read','unread','read') WHERE id=?", [id]);
  if (['archive', 'trash', 'spam'].includes(action)) await db.execute('UPDATE mail_messages SET folder=? WHERE id=?', [action === 'trash' ? 'trash' : action, id]);
  if (action === 'delete') await db.execute('DELETE FROM mail_messages WHERE id=?', [id]);
  res.json({ message: 'Updated.' });
}));

adminRouter.get('/order-create-options', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const [clients] = await db.execute("SELECT id, name FROM clients WHERE status = 'active' ORDER BY name");
  const [products] = await db.execute("SELECT id, name, price, gst_rate, stock_quantity FROM products WHERE status = 'active' ORDER BY name");
  res.json({ clients, products });
}));

adminRouter.post('/orders/create', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const body = req.body;
  const items = (body.items || []).filter((item) => Number(item.product_id) && Number(item.quantity) > 0);
  if (!items.length) return res.status(422).json({ message: 'Add at least one product item.' });

  let subtotal = 0;
  let discountTotal = 0;
  let gstTotal = 0;
  let grandTotal = 0;
  const normalized = items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const price = Number(item.price || 0);
    const discount = Number(item.discount || 0);
    const gst = Number(item.gst || 18);
    const taxable = Math.max(quantity * price - discount, 0);
    const gstAmount = taxable * gst / 100;
    const lineTotal = taxable + gstAmount;
    subtotal += quantity * price;
    discountTotal += discount;
    gstTotal += gstAmount;
    grandTotal += lineTotal;
    return { productId: Number(item.product_id), quantity, price, discount, gst, lineTotal };
  });
  const paid = Math.max(0, Number(body.paid_amount || 0));
  const status = paid >= grandTotal ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
  const invoiceNo = `VEMC-${today().replaceAll('-', '')}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
  const orderDate = body.order_date || today();

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (invoice_no, client_id, order_date, subtotal, discount_total, gst_total, grand_total, paid_amount, payment_status, notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [invoiceNo, body.client_id, orderDate, subtotal, discountTotal, gstTotal, grandTotal, paid, status, body.notes || '']
    );
    for (const item of normalized) {
      await connection.execute('INSERT INTO order_items (order_id, product_id, quantity, price, discount, gst_rate, line_total) VALUES (?,?,?,?,?,?,?)', [orderResult.insertId, item.productId, item.quantity, item.price, item.discount, item.gst, item.lineTotal]);
      await connection.execute('UPDATE products SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id=?', [item.quantity, item.productId]);
      await connection.execute('INSERT INTO stock_ledger (product_id, order_id, movement_date, movement_type, quantity, note) VALUES (?,?,?,?,?,?)', [item.productId, orderResult.insertId, orderDate, 'sold', item.quantity, `Sold on invoice ${invoiceNo}`]);
    }
    await connection.execute('INSERT INTO client_ledger (client_id, order_id, transaction_date, type, amount, description) VALUES (?,?,?,?,?,?)', [body.client_id, orderResult.insertId, orderDate, 'debit', grandTotal, `Invoice ${invoiceNo}`]);
    if (paid > 0) {
      await connection.execute('INSERT INTO payments (order_id, client_id, amount, payment_date, method, note) VALUES (?,?,?,?,?,?)', [orderResult.insertId, body.client_id, paid, orderDate, body.payment_method || 'Cash', 'Initial payment']);
      await connection.execute('INSERT INTO client_ledger (client_id, order_id, transaction_date, type, amount, description) VALUES (?,?,?,?,?,?)', [body.client_id, orderResult.insertId, orderDate, 'credit', paid, `Payment received for ${invoiceNo}`]);
    }
    await connection.commit();
    res.json({ message: 'Order and GST invoice generated.', order_id: orderResult.insertId, invoice_no: invoiceNo });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

adminRouter.get('/settings', asyncHandler(async (req, res) => {
  const [rows] = await tenantDb(req.user.database).execute('SELECT * FROM company_settings ORDER BY id LIMIT 1');
  res.json({ settings: rows[0] || {} });
}));

adminRouter.put('/settings', asyncHandler(async (req, res) => {
  const body = req.body;
  await tenantDb(req.user.database).execute(
    'UPDATE company_settings SET company_name=?, logo=?, favicon=?, phone=?, email=?, address=?, theme_mode=? WHERE id=?',
    [body.company_name, body.logo || null, body.favicon || null, body.phone || null, body.email || null, body.address || null, body.theme_mode || 'dark', body.id]
  );
  res.json({ message: 'Settings saved.' });
}));

adminRouter.get('/categories', asyncHandler(async (req, res) => {
  const [rows] = await tenantDb(req.user.database).execute('SELECT c.*, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name LIMIT 300');
  res.json({ rows });
}));

adminRouter.get('/categories/:id', asyncHandler(async (req, res) => {
  const [[row]] = await tenantDb(req.user.database).execute('SELECT * FROM categories WHERE id=? LIMIT 1', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Category not found.' });
  res.json({ row });
}));

adminRouter.post('/categories', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(422).json({ message: 'Category name is required.' });
  const slug = slugify(req.body.slug || name);
  await db.execute('INSERT INTO categories (name, slug, status) VALUES (?, ?, ?)', [name, slug, req.body.status || 'active']);
  res.json({ message: 'Category added.' });
}));

adminRouter.put('/categories/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(422).json({ message: 'Category name is required.' });
  const slug = slugify(req.body.slug || name);
  await db.execute('UPDATE categories SET name=?, slug=?, status=? WHERE id=?', [name, slug, req.body.status || 'active', req.params.id]);
  res.json({ message: 'Category updated.' });
}));

adminRouter.delete('/categories/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await db.execute('UPDATE products SET category_id = NULL WHERE category_id = ?', [req.params.id]);
  await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ message: 'Category deleted.' });
}));

adminRouter.get('/products', asyncHandler(async (req, res) => {
  const [rows] = await tenantDb(req.user.database).execute(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.id DESC
    LIMIT 300
  `);
  res.json({ rows });
}));

adminRouter.get('/products/:id', asyncHandler(async (req, res) => {
  const [[row]] = await tenantDb(req.user.database).execute('SELECT * FROM products WHERE id=? LIMIT 1', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Product not found.' });
  res.json({ row });
}));

adminRouter.post('/products', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const name = String(req.body.name || '').trim();
  const sku = String(req.body.sku || '').trim();
  if (!name || !sku) return res.status(422).json({ message: 'Product name and SKU are required.' });
  const cols = await columnsFor(db, 'products');
  const product = {
    category_id: req.body.category_id || null,
    name,
    slug: slugify(req.body.slug || name),
    sku,
    product_code: req.body.product_code || null,
    hsn_code: req.body.hsn_code || null,
    unit: req.body.unit || 'PCS',
    cost: Number(req.body.cost || 0),
    price: Number(req.body.price || 0),
    gst_rate: Number(req.body.gst_rate || 18),
    min_stock: Number(req.body.min_stock || 5),
    stock_quantity: Number(req.body.stock_quantity || 0),
    description: req.body.description || '',
    specifications: req.body.specifications || '',
    main_image: req.body.main_image || null,
    status: req.body.status || 'active'
  };
  const insertCols = Object.keys(product).filter((key) => cols.has(key));
  const [insertResult] = await db.execute(
    `INSERT INTO products (${insertCols.map((key) => `\`${key}\``).join(',')}) VALUES (${insertCols.map(() => '?').join(',')})`,
    insertCols.map((key) => product[key])
  );
  const productId = insertResult.insertId;
  if (product.stock_quantity > 0) {
    const ledgerCols = await columnsFor(db, 'stock_ledger');
    const ledger = { product_id: productId, movement_date: today(), movement_type: 'added', quantity: product.stock_quantity, balance_after: product.stock_quantity, note: 'Opening stock' };
    const used = Object.keys(ledger).filter((key) => ledgerCols.has(key));
    await db.execute(`INSERT INTO stock_ledger (${used.map((key) => `\`${key}\``).join(',')}) VALUES (${used.map(() => '?').join(',')})`, used.map((key) => ledger[key]));
  }
  res.json({ message: 'Product added.' });
}));

adminRouter.put('/products/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const [[oldProduct]] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!oldProduct) return res.status(404).json({ message: 'Product not found.' });
  const name = String(req.body.name || oldProduct.name || '').trim();
  const cols = await columnsFor(db, 'products');
  const product = {
    category_id: req.body.category_id || null,
    name,
    slug: slugify(req.body.slug || name),
    sku: req.body.sku || oldProduct.sku,
    product_code: req.body.product_code || null,
    hsn_code: req.body.hsn_code || null,
    unit: req.body.unit || 'PCS',
    cost: Number(req.body.cost || 0),
    price: Number(req.body.price || 0),
    gst_rate: Number(req.body.gst_rate || 18),
    min_stock: Number(req.body.min_stock || 5),
    stock_quantity: Number(req.body.stock_quantity || 0),
    description: req.body.description || '',
    specifications: req.body.specifications || '',
    main_image: req.body.main_image || oldProduct.main_image || null,
    status: req.body.status || 'active'
  };
  const updateCols = Object.keys(product).filter((key) => cols.has(key));
  await db.execute(
    `UPDATE products SET ${updateCols.map((key) => `\`${key}\`=?`).join(', ')} WHERE id=?`,
    [...updateCols.map((key) => product[key]), req.params.id]
  );
  const diff = product.stock_quantity - Number(oldProduct.stock_quantity || 0);
  if (diff !== 0) {
    const ledgerCols = await columnsFor(db, 'stock_ledger');
    const ledger = { product_id: req.params.id, movement_date: today(), movement_type: diff > 0 ? 'added' : 'adjusted', quantity: Math.abs(diff), balance_after: product.stock_quantity, note: 'Manual stock update' };
    const used = Object.keys(ledger).filter((key) => ledgerCols.has(key));
    await db.execute(`INSERT INTO stock_ledger (${used.map((key) => `\`${key}\``).join(',')}) VALUES (${used.map(() => '?').join(',')})`, used.map((key) => ledger[key]));
  }
  res.json({ message: 'Product updated.' });
}));

adminRouter.delete('/products/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await db.execute('DELETE FROM stock_ledger WHERE product_id = ?', [req.params.id]);
  await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Product deleted.' });
}));

adminRouter.get('/products/:id/stock', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const [[product]] = await db.execute('SELECT * FROM products WHERE id=? LIMIT 1', [req.params.id]);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  const [ledger] = await db.execute('SELECT * FROM stock_ledger WHERE product_id=? ORDER BY movement_date DESC, id DESC', [req.params.id]);
  const summary = ledger.reduce((acc, row) => ({ ...acc, [row.movement_type]: (acc[row.movement_type] || 0) + Number(row.quantity || 0) }), {});
  res.json({ product, ledger, summary });
}));

adminRouter.post('/products/:id/stock', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const type = req.body.movement_type || 'added';
  const qty = Math.max(1, Number(req.body.quantity || 1));
  const delta = ['added', 'returned'].includes(type) ? qty : -qty;
  await db.execute('INSERT INTO stock_ledger (product_id, movement_date, movement_type, quantity, note) VALUES (?,?,?,?,?)', [req.params.id, req.body.movement_date || today(), type, qty, req.body.note || '']);
  await db.execute('UPDATE products SET stock_quantity = GREATEST(stock_quantity + ?, 0) WHERE id=?', [delta, req.params.id]);
  res.json({ message: 'Stock ledger updated.' });
}));

adminRouter.post('/:resource/:id/toggle', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const resource = req.params.resource;
  const table = { clients: 'clients', suppliers: 'suppliers', categories: 'categories', products: 'products' }[resource];
  if (!table) return res.status(404).json({ message: 'Resource not found.' });
  await db.execute(`UPDATE \`${table}\` SET status = IF(COALESCE(status,'active')='active','inactive','active') WHERE id=?`, [req.params.id]);
  res.json({ message: 'Status changed.' });
}));

for (const resource of ['clients', 'suppliers']) {
  adminRouter.get(`/${resource}`, asyncHandler(async (req, res) => {
    const db = tenantDb(req.user.database);
    let rows;
    if (resource === 'clients') {
      [rows] = await db.execute('SELECT c.*, COALESCE(SUM(o.grand_total - o.paid_amount),0) AS pending FROM clients c LEFT JOIN orders o ON o.client_id = c.id GROUP BY c.id ORDER BY c.id DESC LIMIT 300');
    } else {
      [rows] = await db.execute('SELECT s.*, COALESCE((SELECT running_balance FROM supplier_ledger l WHERE l.supplier_id = s.id ORDER BY l.id DESC LIMIT 1), s.opening_balance) AS payable FROM suppliers s ORDER BY s.id DESC LIMIT 300');
    }
    res.json({ rows });
  }));

  adminRouter.get(`/${resource}/:id`, asyncHandler(async (req, res) => {
    const [[row]] = await tenantDb(req.user.database).execute(`SELECT * FROM \`${resource}\` WHERE id=? LIMIT 1`, [req.params.id]);
    if (!row) return res.status(404).json({ message: `${resource === 'clients' ? 'Client' : 'Supplier'} not found.` });
    res.json({ row });
  }));

  adminRouter.post(`/${resource}`, asyncHandler(async (req, res) => {
    const db = tenantDb(req.user.database);
    const cols = await columnsFor(db, resource);
    const base = {
      name: String(req.body.name || '').trim(),
      mobile: req.body.mobile || '',
      email: req.body.email || '',
      address: req.body.address || '',
      state: req.body.state || '',
      gst_number: req.body.gst_number || '',
      opening_balance: Number(req.body.opening_balance || 0),
      photo: req.body.photo || null,
      status: req.body.status || 'active'
    };
    if (!base.name) return res.status(422).json({ message: 'Name is required.' });
    const used = Object.keys(base).filter((key) => cols.has(key));
    await db.execute(`INSERT INTO \`${resource}\` (${used.map((key) => `\`${key}\``).join(',')}) VALUES (${used.map(() => '?').join(',')})`, used.map((key) => base[key]));
    res.json({ message: `${resource === 'clients' ? 'Client' : 'Supplier'} added.` });
  }));

  adminRouter.put(`/${resource}/:id`, asyncHandler(async (req, res) => {
    const db = tenantDb(req.user.database);
    const cols = await columnsFor(db, resource);
    const base = {
      name: String(req.body.name || '').trim(),
      mobile: req.body.mobile || '',
      email: req.body.email || '',
      address: req.body.address || '',
      state: req.body.state || '',
      gst_number: req.body.gst_number || '',
      opening_balance: Number(req.body.opening_balance || 0),
      photo: req.body.photo || null,
      status: req.body.status || 'active'
    };
    if (!base.name) return res.status(422).json({ message: 'Name is required.' });
    const used = Object.keys(base).filter((key) => cols.has(key));
    await db.execute(`UPDATE \`${resource}\` SET ${used.map((key) => `\`${key}\`=?`).join(', ')} WHERE id=?`, [...used.map((key) => base[key]), req.params.id]);
    res.json({ message: `${resource === 'clients' ? 'Client' : 'Supplier'} updated.` });
  }));

  adminRouter.delete(`/${resource}/:id`, asyncHandler(async (req, res) => {
    await tenantDb(req.user.database).execute(`DELETE FROM \`${resource}\` WHERE id=?`, [req.params.id]);
    res.json({ message: `${resource === 'clients' ? 'Client' : 'Supplier'} deleted.` });
  }));
}

adminRouter.get('/clients/:id/profile', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const [[client]] = await db.execute('SELECT * FROM clients WHERE id=? LIMIT 1', [req.params.id]);
  if (!client) return res.status(404).json({ message: 'Client not found.' });
  let invoices = [];
  let ledgerRows = [];
  let summary = { total: 0, paid: 0 };
  try {
    const [orders] = await db.execute("SELECT id, invoice_no, order_date AS invoice_date, grand_total, paid_amount, (grand_total - paid_amount) AS due_amount, payment_status, 'order' AS invoice_type FROM orders WHERE client_id=?", [req.params.id]);
    const [sales] = await db.execute("SELECT id, invoice_no, invoice_date, grand_total, paid_amount, due_amount, payment_status, 'sales' AS invoice_type FROM sales_invoices WHERE client_id=?", [req.params.id]);
    invoices = [...orders, ...sales].sort((a, b) => String(b.invoice_date).localeCompare(String(a.invoice_date)));
  } catch {}
  try {
    const [ledgerAsc] = await db.execute('SELECT * FROM client_ledger WHERE client_id=? ORDER BY transaction_date ASC, id ASC', [req.params.id]);
    let runningBalance = Number(client.opening_balance || 0);
    ledgerRows = ledgerAsc.map((entry) => {
      let debit = Number(entry.debit || 0);
      let credit = Number(entry.credit || 0);
      if (debit <= 0 && credit <= 0 && Number(entry.amount || 0) > 0) {
        if (entry.type === 'credit') credit = Number(entry.amount || 0);
        else debit = Number(entry.amount || 0);
      }
      runningBalance += debit - credit;
      return { ...entry, display_debit: debit, display_credit: credit, display_balance: runningBalance };
    }).reverse();
  } catch {}
  try {
    const [[row]] = await db.execute("SELECT COALESCE(SUM(total),0) total, COALESCE(SUM(paid),0) paid FROM (SELECT grand_total AS total, paid_amount AS paid FROM orders WHERE client_id=? UNION ALL SELECT grand_total AS total, paid_amount AS paid FROM sales_invoices WHERE client_id=?) invoice_summary", [req.params.id, req.params.id]);
    summary = row;
  } catch {}
  res.json({ client, invoices, ledgerRows, summary });
}));

adminRouter.get('/suppliers/:id/profile', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const [[supplier]] = await db.execute('SELECT * FROM suppliers WHERE id=? LIMIT 1', [req.params.id]);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
  let purchases = [];
  let ledgerRows = [];
  try {
    [purchases] = await db.execute('SELECT * FROM purchases WHERE supplier_id=? ORDER BY id DESC', [req.params.id]);
  } catch {}
  try {
    [ledgerRows] = await db.execute('SELECT * FROM supplier_ledger WHERE supplier_id=? ORDER BY transaction_date DESC, id DESC', [req.params.id]);
  } catch {}
  res.json({ supplier, purchases, ledgerRows, payable: ledgerRows[0]?.running_balance || supplier.opening_balance || 0 });
}));

adminRouter.get('/ledger-master', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const q = `%${req.query.q || ''}%`;
  const [rows] = await db.execute(`
    SELECT l.*, g.name AS group_name, g.nature
    FROM accounting_ledgers l
    JOIN accounting_ledger_groups g ON g.id = l.group_id
    WHERE l.name LIKE ? OR g.name LIKE ? OR l.gst_number LIKE ?
    ORDER BY g.name, l.name
  `, [q, q, q]);
  const [groups] = await db.execute('SELECT * FROM accounting_ledger_groups ORDER BY name');
  res.json({ rows, groups });
}));

adminRouter.post('/ledger-master', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const body = req.body;
  await db.execute('INSERT INTO accounting_ledgers (group_id, name, opening_balance, opening_type, contact_name, mobile, email, gst_number, address, notes, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [body.group_id, body.name, Number(body.opening_balance || 0), body.opening_type || 'Dr', body.contact_name || '', body.mobile || '', body.email || '', body.gst_number || '', body.address || '', body.notes || '', body.status || 'active']);
  res.json({ message: 'Ledger created.' });
}));

adminRouter.put('/ledger-master/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const body = req.body;
  await db.execute('UPDATE accounting_ledgers SET group_id=?, name=?, opening_balance=?, opening_type=?, contact_name=?, mobile=?, email=?, gst_number=?, address=?, notes=?, status=? WHERE id=?', [body.group_id, body.name, Number(body.opening_balance || 0), body.opening_type || 'Dr', body.contact_name || '', body.mobile || '', body.email || '', body.gst_number || '', body.address || '', body.notes || '', body.status || 'active', req.params.id]);
  res.json({ message: 'Ledger updated.' });
}));

const moduleConfig = {
  units: { title: 'Units', titleLabel: 'Unit Name', referenceLabel: 'Short Code', partyLabel: 'Usage Area', amountLabel: 'Conversion Value' },
  brands: { title: 'Brands', titleLabel: 'Brand Name', referenceLabel: 'Brand Code', partyLabel: 'Supplier / Owner', amountLabel: 'Target Margin %' },
  'gst-rates': { title: 'GST Rates', titleLabel: 'GST Rate Name', referenceLabel: 'HSN / SAC', partyLabel: 'Tax Group', amountLabel: 'GST %' },
  leads: { title: 'Leads', titleLabel: 'Lead Name', referenceLabel: 'Lead Source', partyLabel: 'Contact Person', amountLabel: 'Deal Value' },
  enquiries: { title: 'Enquiries', titleLabel: 'Enquiry Title', referenceLabel: 'Enquiry No.', partyLabel: 'Client / Visitor', amountLabel: 'Expected Value' },
  'follow-ups': { title: 'Follow Ups', titleLabel: 'Follow Up Title', referenceLabel: 'Related Lead / Client', partyLabel: 'Assigned To', amountLabel: 'Expected Value' },
  'customer-activities': { title: 'Customer Activities', titleLabel: 'Activity Title', referenceLabel: 'Activity Type', partyLabel: 'Client', amountLabel: 'Value' },
  'client-communication': { title: 'Client Communication', titleLabel: 'Communication Subject', referenceLabel: 'Channel', partyLabel: 'Client', amountLabel: 'Value' },
  quotations: { title: 'Quotations', titleLabel: 'Quotation Title', referenceLabel: 'Quotation No.', partyLabel: 'Client', amountLabel: 'Quotation Amount' },
  stock: { title: 'Stock', titleLabel: 'Stock Entry', referenceLabel: 'Product / SKU', partyLabel: 'Warehouse', amountLabel: 'Quantity' },
  purchases: { title: 'Purchases', titleLabel: 'Purchase Entry', referenceLabel: 'Bill No.', partyLabel: 'Supplier', amountLabel: 'Purchase Amount' },
  sales: { title: 'Sales', titleLabel: 'Sale Entry', referenceLabel: 'Invoice No.', partyLabel: 'Client', amountLabel: 'Sale Amount' },
  orders: { title: 'Orders', titleLabel: 'Order Entry', referenceLabel: 'Order / Invoice No.', partyLabel: 'Client', amountLabel: 'Order Amount' },
  'purchase-return': { title: 'Purchase Return', titleLabel: 'Return Entry', referenceLabel: 'Return No.', partyLabel: 'Supplier', amountLabel: 'Return Amount' },
  'sales-return': { title: 'Sales Return', titleLabel: 'Return Entry', referenceLabel: 'Return No.', partyLabel: 'Client', amountLabel: 'Return Amount' },
  'stock-transfer': { title: 'Stock Transfer', titleLabel: 'Transfer Entry', referenceLabel: 'Transfer No.', partyLabel: 'From / To Location', amountLabel: 'Quantity' },
  'low-stock-alerts': { title: 'Low Stock Alerts', titleLabel: 'Alert Title', referenceLabel: 'Product / SKU', partyLabel: 'Warehouse', amountLabel: 'Current Stock' },
  'raw-materials': { title: 'Raw Materials', titleLabel: 'Raw Material', referenceLabel: 'Material Code', partyLabel: 'Supplier', amountLabel: 'Current Stock' },
  bom: { title: 'BOM', titleLabel: 'BOM Name', referenceLabel: 'BOM Code', partyLabel: 'Finished Product', amountLabel: 'Estimated Cost' },
  'production-orders': { title: 'Production Orders', titleLabel: 'Production Order', referenceLabel: 'Order No.', partyLabel: 'Product', amountLabel: 'Quantity' },
  'work-orders': { title: 'Work Orders', titleLabel: 'Work Order', referenceLabel: 'Work Order No.', partyLabel: 'Assigned Team', amountLabel: 'Quantity' },
  'finished-goods': { title: 'Finished Goods', titleLabel: 'Finished Good', referenceLabel: 'SKU', partyLabel: 'Category', amountLabel: 'Stock' },
  'damage-wastage': { title: 'Damage/Wastage', titleLabel: 'Damage/Wastage Entry', referenceLabel: 'Reference No.', partyLabel: 'Department', amountLabel: 'Loss Value' },
  'production-reports': { title: 'Production Reports', titleLabel: 'Report Title', referenceLabel: 'Report No.', partyLabel: 'Production Unit', amountLabel: 'Value' },
  ledgers: { title: 'Ledgers', titleLabel: 'Ledger Entry', referenceLabel: 'Ledger Code', partyLabel: 'Account Group', amountLabel: 'Opening Balance' },
  vouchers: { title: 'Vouchers', titleLabel: 'Voucher Entry', referenceLabel: 'Voucher No.', partyLabel: 'Account', amountLabel: 'Amount' },
  'cash-book': { title: 'Cash Book', titleLabel: 'Cash Entry', referenceLabel: 'Voucher / Ref No.', partyLabel: 'Account', amountLabel: 'Amount' },
  'bank-book': { title: 'Bank Book', titleLabel: 'Bank Entry', referenceLabel: 'Voucher / Ref No.', partyLabel: 'Bank Account', amountLabel: 'Amount' },
  'day-book': { title: 'Day Book', titleLabel: 'Day Book Entry', referenceLabel: 'Voucher / Ref No.', partyLabel: 'Account', amountLabel: 'Amount' },
  payments: { title: 'Payments', titleLabel: 'Payment Entry', referenceLabel: 'Payment Ref No.', partyLabel: 'Party', amountLabel: 'Amount' },
  expenses: { title: 'Expenses', titleLabel: 'Expense Entry', referenceLabel: 'Expense Ref No.', partyLabel: 'Expense Head', amountLabel: 'Amount' },
  earnings: { title: 'Earnings', titleLabel: 'Earning Entry', referenceLabel: 'Earning Ref No.', partyLabel: 'Income Head', amountLabel: 'Amount' },
  'journal-entries': { title: 'Journal Entries', titleLabel: 'Journal Entry', referenceLabel: 'Journal No.', partyLabel: 'Account', amountLabel: 'Amount' },
  gst: { title: 'GST', titleLabel: 'GST Entry', referenceLabel: 'GST Ref No.', partyLabel: 'Tax Group', amountLabel: 'GST Amount' },
  invoices: { title: 'Invoices', titleLabel: 'Invoice Entry', referenceLabel: 'Invoice No.', partyLabel: 'Client', amountLabel: 'Invoice Amount' },
  'credit-notes': { title: 'Credit Notes', titleLabel: 'Credit Note', referenceLabel: 'Credit Note No.', partyLabel: 'Client / Account', amountLabel: 'Amount' },
  'debit-notes': { title: 'Debit Notes', titleLabel: 'Debit Note', referenceLabel: 'Debit Note No.', partyLabel: 'Supplier / Account', amountLabel: 'Amount' },
  'proforma-invoices': { title: 'Proforma Invoices', titleLabel: 'Proforma Invoice', referenceLabel: 'Invoice No.', partyLabel: 'Client', amountLabel: 'Invoice Amount' },
  'e-way-bill': { title: 'E-Way Bill', titleLabel: 'E-Way Bill', referenceLabel: 'E-Way Bill No.', partyLabel: 'Transporter', amountLabel: 'Invoice Value' },
  'financial-reports': { title: 'Financial Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Account Group', amountLabel: 'Value' },
  'inventory-reports': { title: 'Inventory Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Warehouse', amountLabel: 'Value' },
  'manufacturing-reports': { title: 'Manufacturing Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Production Unit', amountLabel: 'Value' },
  'gst-reports': { title: 'GST Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Tax Period', amountLabel: 'Value' },
  'sales-reports': { title: 'Sales Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Client Segment', amountLabel: 'Value' },
  'purchase-reports': { title: 'Purchase Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Supplier Segment', amountLabel: 'Value' },
  'expense-reports': { title: 'Expense Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Expense Head', amountLabel: 'Value' },
  'outstanding-reports': { title: 'Outstanding Reports', titleLabel: 'Report Title', referenceLabel: 'Report Type', partyLabel: 'Party', amountLabel: 'Outstanding Amount' },
  users: { title: 'Users', titleLabel: 'User Name', referenceLabel: 'Email / Login', partyLabel: 'Role', amountLabel: 'Access Level' },
  'roles-permissions': { title: 'Roles & Permissions', titleLabel: 'Role / Permission', referenceLabel: 'Permission Key', partyLabel: 'User Group', amountLabel: 'Access Level' },
  employees: { title: 'Employees', titleLabel: 'Employee Name', referenceLabel: 'Employee Code', partyLabel: 'Department', amountLabel: 'Salary' },
  attendance: { title: 'Attendance', titleLabel: 'Attendance Entry', referenceLabel: 'Employee Code', partyLabel: 'Employee', amountLabel: 'Hours' },
  'leave-management': { title: 'Leave Management', titleLabel: 'Leave Request', referenceLabel: 'Leave Type', partyLabel: 'Employee', amountLabel: 'Days' },
  salary: { title: 'Salary', titleLabel: 'Salary Entry', referenceLabel: 'Payroll Month', partyLabel: 'Employee', amountLabel: 'Net Salary' },
  'activity-logs': { title: 'Activity Logs', titleLabel: 'Activity Title', referenceLabel: 'Activity Type', partyLabel: 'User', amountLabel: 'Risk Level' },
  backup: { title: 'Backup', titleLabel: 'Backup Job', referenceLabel: 'Backup Type', partyLabel: 'Storage', amountLabel: 'Size MB' },
  'search-everything': { title: 'Search Everything', titleLabel: 'Search Entry', referenceLabel: 'Module', partyLabel: 'Result Owner', amountLabel: 'Result Count' },
  notifications: { title: 'Notifications', titleLabel: 'Notification', referenceLabel: 'Audience', partyLabel: 'Channel', amountLabel: 'Priority' },
  'import-data': { title: 'Import Data', titleLabel: 'Import Job', referenceLabel: 'File / Source', partyLabel: 'Module', amountLabel: 'Rows' },
  'export-data': { title: 'Export Data', titleLabel: 'Export Job', referenceLabel: 'Export Type', partyLabel: 'Module', amountLabel: 'Rows' },
  'document-uploads': { title: 'Document Uploads', titleLabel: 'Document Name', referenceLabel: 'Document Type', partyLabel: 'Linked Party', amountLabel: 'File Size MB' },
  'audit-logs': { title: 'Audit Logs', titleLabel: 'Audit Entry', referenceLabel: 'Audit Type', partyLabel: 'User', amountLabel: 'Risk Level' },
  'storefront-products': { title: 'Storefront Products', titleLabel: 'Product Display', referenceLabel: 'Product / SKU', partyLabel: 'Category', amountLabel: 'Display Price' },
  'storefront-orders': { title: 'Storefront Orders', titleLabel: 'Storefront Order', referenceLabel: 'Order No.', partyLabel: 'Customer', amountLabel: 'Order Amount' },
  'storefront-customers': { title: 'Storefront Customers', titleLabel: 'Customer Name', referenceLabel: 'Email / Mobile', partyLabel: 'Customer Segment', amountLabel: 'Lifetime Value' },
  coupons: { title: 'Coupons', titleLabel: 'Coupon Code', referenceLabel: 'Discount Type', partyLabel: 'Applicable Segment', amountLabel: 'Discount Value' },
  reviews: { title: 'Reviews', titleLabel: 'Review Title', referenceLabel: 'Rating', partyLabel: 'Customer', amountLabel: 'Score' }
};

adminRouter.get('/modules/:module', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureErpModuleRecords(db);
  const config = moduleConfig[req.params.module] || { title: req.params.module };
  const q = `%${req.query.q || ''}%`;
  const status = req.query.status ? String(req.query.status) : '';
  const where = ['module_key=?', '(title LIKE ? OR reference_no LIKE ? OR party_name LIKE ?)'];
  const params = [req.params.module, q, q, q];
  if (status) {
    where.push('status=?');
    params.push(status);
  }
  const [rows] = await db.execute(`SELECT * FROM erp_module_records WHERE ${where.join(' AND ')} ORDER BY id DESC`, params);
  const [counts] = await db.execute('SELECT status, COUNT(*) total FROM erp_module_records WHERE module_key=? GROUP BY status', [req.params.module]);
  res.json({ rows, counts, config });
}));

adminRouter.post('/modules/:module', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureErpModuleRecords(db);
  const body = req.body;
  await db.execute('INSERT INTO erp_module_records (module_key, title, reference_no, party_name, amount, status, due_date, description, metadata, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)', [req.params.module, body.title, body.reference_no || '', body.party_name || '', body.amount || null, body.status || 'active', body.due_date || null, body.description || '', JSON.stringify({ module_label: moduleConfig[req.params.module]?.title || req.params.module }), req.user.id]);
  res.json({ message: 'Entry saved.' });
}));

adminRouter.put('/modules/:module/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const body = req.body;
  await db.execute('UPDATE erp_module_records SET title=?, reference_no=?, party_name=?, amount=?, status=?, due_date=?, description=?, metadata=? WHERE id=? AND module_key=?', [body.title, body.reference_no || '', body.party_name || '', body.amount || null, body.status || 'active', body.due_date || null, body.description || '', JSON.stringify({ module_label: moduleConfig[req.params.module]?.title || req.params.module }), req.params.id, req.params.module]);
  res.json({ message: 'Entry updated.' });
}));

adminRouter.delete('/modules/:module/:id', asyncHandler(async (req, res) => {
  await tenantDb(req.user.database).execute('DELETE FROM erp_module_records WHERE id=? AND module_key=?', [req.params.id, req.params.module]);
  res.json({ message: 'Entry deleted.' });
}));

adminRouter.get('/exact/:screen', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  const screen = req.params.screen;
  const q = `%${req.query.q || ''}%`;
  const rows = [];
  let config = null;

  if (screen === 'enquiries') {
    const status = String(req.query.status || '');
    const where = [];
    const params = [];
    if (status) {
      where.push('e.status = ?');
      params.push(status);
    }
    const [records] = await db.execute(`
      SELECT e.*, p.name AS product_name, p.slug AS product_slug
      FROM enquiries e
      LEFT JOIN products p ON p.id = e.product_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY e.created_at DESC, e.id DESC
    `, params);
    config = {
      title: 'Inquiry',
      panelTitle: '',
      filters: [{ type: 'select', name: 'status', options: [['', 'All Enquiries'], ['unread', 'Unread'], ['read', 'Read'], ['replied', 'Replied'], ['closed', 'Closed']] }],
      buttons: [],
      headers: ['Date', 'Name', 'Contact', 'Subject', 'Product', 'Status', 'Action']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      warning: row.status === 'unread',
      cells: [
        { text: row.created_at, link: true },
        { text: row.name, link: true },
        { html: `<div>${row.mobile || ''}</div><div class="small text-muted">${row.email || ''}</div>` },
        { html: `<strong>${row.subject || 'Website enquiry'}</strong><div class="small text-muted">${String(row.message || '').slice(0, 80)}${String(row.message || '').length > 80 ? '...' : ''}</div>`, link: true },
        { text: row.product_name || 'General' },
        { badge: row.status, badgeClass: row.status === 'unread' ? 'danger' : row.status === 'closed' ? 'secondary' : 'success' }
      ],
      actions: [
        { title: 'View enquiry', icon: 'bi-eye', variant: 'outline-primary' },
        { title: 'WhatsApp', icon: 'bi-whatsapp', variant: 'outline-success' },
        ...(row.email ? [{ title: 'Email', icon: 'bi-envelope', variant: 'outline-secondary' }] : [])
      ]
    }));
  }

  if (screen === 'stock') {
    const [products] = await db.execute('SELECT p.*, c.name AS category FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.name');
    const [ledger] = await db.execute('SELECT l.*, p.name AS product_name FROM stock_ledger l JOIN products p ON p.id = l.product_id ORDER BY l.movement_date DESC, l.id DESC LIMIT 200');
    return res.json({
      type: 'stock',
      title: 'Stock Management',
      products,
      ledger,
      productOptions: products.map((product) => ({ value: product.id, label: `${product.name} (${Number(product.stock_quantity || 0)})` }))
    });
  }

  if (screen === 'purchases') {
    const [records] = await db.execute('SELECT p.*, s.name AS supplier_name FROM purchases p JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.id DESC');
    config = {
      title: 'Purchase Management',
      panelTitle: 'Purchase History',
      buttons: [{ label: 'Add Purchase Bill', variant: 'primary' }],
      headers: ['Bill', 'Supplier', 'Date', 'Total', 'Paid', 'Due', 'Status', 'Action']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [row.bill_no, row.supplier_name, row.purchase_date, moneyString(row.grand_total), moneyString(row.paid_amount), moneyString(row.due_amount), row.payment_status],
      actions: [{ label: 'View', variant: 'primary' }]
    }));
  }

  if (screen === 'sales') {
    const where = [];
    const params = [];
    if (req.query.from) { where.push('s.invoice_date >= ?'); params.push(req.query.from); }
    if (req.query.to) { where.push('s.invoice_date <= ?'); params.push(req.query.to); }
    const [records] = await db.execute(`
      SELECT s.*, c.name AS client_name
      FROM sales_invoices s
      JOIN clients c ON c.id = s.client_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY s.id DESC
    `, params);
    config = {
      title: 'Sales Invoices',
      filters: [{ type: 'date', name: 'from' }, { type: 'date', name: 'to' }],
      buttons: [{ label: 'Create Sales Invoice', variant: 'primary' }],
      headers: ['Invoice', 'Client', 'Date', 'Total', 'Paid', 'Due', 'Status', 'Action']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [
        { text: row.invoice_no, link: true },
        row.client_name,
        row.invoice_date,
        moneyString(row.grand_total),
        moneyString(row.paid_amount),
        moneyString(row.due_amount),
        { badge: row.payment_status, badgeClass: paymentBadge(row.payment_status === 'Unpaid' ? 'Pending' : row.payment_status) }
      ],
      actions: [{ label: 'View / PDF', variant: 'primary' }]
    }));
  }

  if (screen === 'orders') {
    const where = [];
    const params = [];
    if (req.query.client_id) { where.push('o.client_id = ?'); params.push(req.query.client_id); }
    if (req.query.payment_status) { where.push('o.payment_status = ?'); params.push(req.query.payment_status); }
    if (req.query.from) { where.push('o.order_date >= ?'); params.push(req.query.from); }
    if (req.query.to) { where.push('o.order_date <= ?'); params.push(req.query.to); }
    const [records] = await db.execute(`
      SELECT o.*, c.name AS client_name
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY o.id DESC
    `, params);
    const [clients] = await db.execute("SELECT id, name FROM clients WHERE status = 'active' ORDER BY name");
    config = {
      title: 'Orders',
      filters: [
        { type: 'select', name: 'client_id', options: [['', 'All Clients'], ...clients.map((client) => [String(client.id), client.name])] },
        { type: 'select', name: 'payment_status', options: [['', 'All Status'], ['Pending', 'Pending'], ['Partial', 'Partial'], ['Paid', 'Paid']] },
        { type: 'date', name: 'from' },
        { type: 'date', name: 'to' }
      ],
      buttons: [{ label: 'Create Order', variant: 'primary', action: 'create-order' }],
      headers: ['Invoice', 'Client', 'Date', 'Total', 'Paid', 'Payment', 'Order', 'Delivery', '']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [
        row.invoice_no,
        row.client_name,
        row.order_date,
        moneyString(row.grand_total),
        moneyString(row.paid_amount),
        { badge: row.payment_status, badgeClass: paymentBadge(row.payment_status) },
        row.order_status || 'Pending',
        row.delivery_status || 'Pending'
      ],
      actions: [
        { title: 'Invoice', icon: 'bi-receipt', variant: 'outline-primary' },
        { title: 'Update status', icon: 'bi-truck', variant: 'outline-secondary' },
        { title: 'Delete', icon: 'bi-trash3', variant: 'outline-danger' }
      ]
    }));
  }

  if (screen === 'payments') {
    const [records] = await db.execute('SELECT p.*, c.name AS client_name, s.name AS supplier_name FROM payments p LEFT JOIN clients c ON c.id = p.client_id LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.payment_date DESC, p.id DESC');
    config = {
      title: 'Payment Ledger',
      topButtons: [
        { label: 'Client Payment Received', variant: 'primary', modalScreen: 'payment-client' },
        { label: 'Direct Client Receipt', variant: 'outline-primary', modalScreen: 'payment-direct' },
        { label: 'Supplier Payment Paid', variant: 'outline-primary', modalScreen: 'payment-supplier' }
      ],
      datatable: true,
      headers: ['Date', 'Type', 'Party', 'Amount', 'Mode', 'Reference', 'Remarks']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [row.payment_date, row.payment_type, row.client_name || row.supplier_name || '', moneyString(row.amount), row.method, row.reference_no, row.remarks || row.note || '']
    }));
  }

  if (screen === 'payment-client' || screen === 'payment-supplier') {
    const isClient = screen === 'payment-client';
    const [records] = isClient
      ? await db.execute('SELECT s.*, c.name AS client_name FROM sales_invoices s JOIN clients c ON c.id = s.client_id WHERE s.due_amount > 0 ORDER BY s.id DESC')
      : await db.execute('SELECT p.*, s.name AS supplier_name FROM purchases p JOIN suppliers s ON s.id = p.supplier_id WHERE p.due_amount > 0 ORDER BY p.id DESC');
    return res.json({
      type: 'payment-form',
      title: isClient ? 'Client Payment Received' : 'Supplier Payment Paid',
      selectLabel: isClient ? 'Invoice' : 'Purchase Bill',
      selectName: isClient ? 'sales_invoice_id' : 'purchase_id',
      submitLabel: isClient ? 'Record Payment' : 'Record Supplier Payment',
      options: records.map((row) => ({
        value: row.id,
        label: isClient
          ? `${row.invoice_no} - ${row.client_name} - Due ${moneyString(row.due_amount)}`
          : `${row.bill_no} - ${row.supplier_name} - Due ${moneyString(row.due_amount)}`
      }))
    });
  }

  if (screen === 'payment-direct') {
    const [clients] = await db.execute("SELECT c.id, c.name, c.mobile, COALESCE((SELECT running_balance FROM client_ledger l WHERE l.client_id = c.id ORDER BY l.id DESC LIMIT 1), 0) AS balance FROM clients c WHERE c.status = 'active' ORDER BY c.name");
    const [invoices] = await db.execute('SELECT id, client_id, invoice_no, due_amount FROM sales_invoices WHERE due_amount > 0 ORDER BY invoice_date DESC, id DESC');
    return res.json({
      type: 'direct-payment-form',
      title: 'Receive Client Payment',
      clients: clients.map((client) => ({
        value: client.id,
        label: `${client.name} - ${client.mobile || ''}`.trim(),
        balance: moneyString(client.balance || 0)
      })),
      invoices: invoices.map((invoice) => ({
        value: invoice.id,
        clientId: invoice.client_id,
        label: `${invoice.invoice_no} - Due ${moneyString(invoice.due_amount)}`
      }))
    });
  }

  if (screen === 'journal-entries') {
    const [ledgers] = await db.execute("SELECT id, name FROM accounting_ledgers WHERE status = 'active' ORDER BY name");
    return res.json({
      type: 'voucher-form',
      title: 'Create Voucher',
      datatable: true,
      ledgers: ledgers.map((ledger) => ({ value: ledger.id, label: ledger.name })),
      types: ['Payment', 'Receipt', 'Contra', 'Journal', 'Sales', 'Purchase', 'Debit Note', 'Credit Note']
    });
  }

  if (screen === 'ledgers') {
    const [clientLedger] = await db.execute('SELECT l.*, c.name AS client_name FROM client_ledger l JOIN clients c ON c.id = l.client_id ORDER BY l.transaction_date DESC, l.id DESC LIMIT 100');
    const [supplierLedger] = await db.execute('SELECT l.*, s.name AS supplier_name FROM supplier_ledger l JOIN suppliers s ON s.id = l.supplier_id ORDER BY l.transaction_date DESC, l.id DESC LIMIT 100');
    const [cashBankLedger] = await db.execute('SELECT * FROM cash_bank_ledger ORDER BY transaction_date DESC, id DESC LIMIT 100');
    const [stockLedger] = await db.execute('SELECT s.*, p.name AS product_name FROM stock_ledger s JOIN products p ON p.id = s.product_id ORDER BY s.movement_date DESC, s.id DESC LIMIT 100');
    return res.json({
      type: 'multi-tables',
      title: 'Ledgers',
      topButtons: [
        { label: 'Export Client Ledger CSV' },
        { label: 'Export Supplier Ledger CSV' },
        { label: 'Export Cash / Bank CSV' },
        { label: 'Export Stock Ledger CSV' }
      ],
      panels: [
        { title: 'Client Ledger', columnClass: 'col-lg-6', headers: ['Date', 'Client', 'Ref', 'Debit', 'Credit', 'Balance'], rows: clientLedger.map((row) => [row.transaction_date, { text: row.client_name, link: true }, row.reference_no || '', moneyString(row.debit || 0), moneyString(row.credit || 0), moneyString(row.running_balance || row.amount)]) },
        { title: 'Supplier Ledger', columnClass: 'col-lg-6', headers: ['Date', 'Supplier', 'Ref', 'Debit', 'Credit', 'Balance'], rows: supplierLedger.map((row) => [row.transaction_date, { text: row.supplier_name, link: true }, row.reference_no || '', moneyString(row.debit || 0), moneyString(row.credit || 0), moneyString(row.running_balance || 0)]) },
        { title: 'Cash / Bank Ledger', columnClass: 'col-lg-6', headers: ['Date', 'Account', 'In/Out', 'Amount', 'Balance', 'Description'], rows: cashBankLedger.map((row) => [row.transaction_date, row.account_type, row.direction, moneyString(row.amount), moneyString(row.running_balance), row.description]) },
        { title: 'Stock Ledger', columnClass: 'col-lg-6', headers: ['Date', 'Product', 'Type', 'Qty', 'Balance', 'Note'], rows: stockLedger.map((row) => [row.movement_date, { text: row.product_name, link: true }, row.movement_type, Number(row.quantity || 0), row.balance_after || '', row.note]) }
      ]
    });
  }

  if (screen === 'vouchers') {
    const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const to = req.query.to || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
    const type = String(req.query.type || '');
    const where = ['v.voucher_date BETWEEN ? AND ?'];
    const params = [from, to];
    if (type) { where.push('v.voucher_type = ?'); params.push(type); }
    const [records] = await db.execute(`SELECT v.*, COALESCE(SUM(e.debit),0) AS total FROM accounting_vouchers v LEFT JOIN accounting_entries e ON e.voucher_id = v.id WHERE ${where.join(' AND ')} GROUP BY v.id ORDER BY voucher_date DESC, id DESC`, params);
    config = {
      title: 'Vouchers',
      filters: [
        { type: 'date', name: 'from', value: from },
        { type: 'date', name: 'to', value: to },
        { type: 'select', name: 'type', options: [['', 'All Voucher Types'], ...['Payment', 'Receipt', 'Contra', 'Journal', 'Sales', 'Purchase', 'Debit Note', 'Credit Note'].map((item) => [item, item])] }
      ],
      buttons: [{ label: 'Create Voucher', variant: 'primary' }],
      headers: ['Date', 'Voucher No', 'Type', 'Reference', 'Narration', 'Total', 'Action']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [row.voucher_date, { text: row.voucher_no, link: true }, row.voucher_type, row.reference_no || '', row.narration || '', moneyString(row.total)],
      actions: [{ label: 'View', variant: 'primary' }]
    }));
  }

  if (screen === 'cash-book' || screen === 'bank-book') {
    const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const to = req.query.to || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
    const book = screen === 'cash-book' ? 'cash' : 'bank';
    const where = ['v.voucher_date BETWEEN ? AND ?'];
    const params = [from, to];
    where.push(book === 'cash' ? "l.system_key = 'cash'" : "l.system_key = 'bank'");
    const [records] = await db.execute(`SELECT v.voucher_date, v.voucher_no, v.voucher_type, l.name AS ledger_name, e.particulars, e.debit, e.credit FROM accounting_entries e JOIN accounting_vouchers v ON v.id = e.voucher_id JOIN accounting_ledgers l ON l.id = e.ledger_id WHERE ${where.join(' AND ')} ORDER BY v.voucher_date DESC, v.id DESC, e.id`, params);
    return res.json({
      type: 'multi-tables',
      title: 'Accounting Books',
      filters: [
        { type: 'date', name: 'from', value: from },
        { type: 'date', name: 'to', value: to },
        { type: 'select', name: 'book', value: book, options: [['day', 'Day Book'], ['cash', 'Cash Book'], ['bank', 'Bank Book']] }
      ],
      filterButtons: [{ label: 'Excel' }, { label: 'PDF' }],
      panels: [{
        title: `${titleCase(book)} Book`,
        columnClass: 'col-12',
        headers: ['Date', 'Voucher', 'Type', 'Ledger', 'Particulars', 'Debit', 'Credit'],
        rows: records.map((row) => [row.voucher_date, row.voucher_no, row.voucher_type, row.ledger_name, row.particulars || '', moneyString(row.debit), moneyString(row.credit)])
      }]
    });
  }

  if (screen === 'invoices') {
    const where = [];
    const params = [];
    if (req.query.from) { where.push('s.invoice_date >= ?'); params.push(req.query.from); }
    if (req.query.to) { where.push('s.invoice_date <= ?'); params.push(req.query.to); }
    const [records] = await db.execute(`
      SELECT s.*, c.name AS client_name
      FROM sales_invoices s
      JOIN clients c ON c.id = s.client_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY s.id DESC
    `, params);
    config = {
      title: 'Invoices',
      panelTitle: 'GST Invoices',
      panelHelp: 'Create, view, print and track GST sales invoices.',
      buttons: [{ label: 'Create Invoice', variant: 'primary', icon: 'bi-plus-lg' }],
      exportButtons: ['Export CSV', 'Export Excel', 'Export PDF'],
      filters: [{ type: 'date', name: 'from' }, { type: 'date', name: 'to' }],
      headers: ['Invoice', 'Client', 'Date', 'Total', 'Paid', 'Due', 'Status', 'Actions']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [
        { text: row.invoice_no, link: true },
        row.client_name,
        row.invoice_date,
        moneyString(row.grand_total),
        moneyString(row.paid_amount),
        moneyString(row.due_amount),
        { badge: row.payment_status, badgeClass: paymentBadge(row.payment_status === 'Unpaid' ? 'Pending' : row.payment_status) }
      ],
      actions: [{ label: 'View / PDF', variant: 'primary' }]
    }));
  }

  if (screen === 'users') {
    const [records] = await db.execute('SELECT u.*, r.name AS role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id ORDER BY u.id DESC');
    config = {
      title: 'User Management',
      panelTitle: 'Users & Roles',
      buttons: [{ label: 'Add User', variant: 'primary' }],
      headers: ['Name', 'Email', 'Password', 'Role', 'Status', 'Action']
    };
    records.forEach((row) => rows.push({
      id: row.id,
      cells: [
        row.name,
        row.email,
        { html: '<span class="badge text-bg-secondary">Hidden</span> <span class="text-muted">Edit to reset</span>' },
        row.role_name || '',
        { badge: row.status, badgeClass: row.status === 'active' ? 'success' : 'secondary' }
      ],
      actions: [
        { title: 'Edit user', icon: 'bi-pencil-square', variant: 'outline-primary' },
        { title: 'Delete user', icon: 'bi-trash3', variant: 'outline-danger' }
      ]
    }));
  }

  if (screen === 'expenses' || screen === 'earnings') {
    const isExpense = screen === 'expenses';
    const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const to = req.query.to || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
    const table = isExpense ? 'expenses' : 'earnings';
    const dateColumn = isExpense ? 'expense_date' : 'earning_date';
    const sourceColumn = isExpense ? 'category' : 'source';
    const where = [`${isExpense ? 'e' : 'e'}.${dateColumn} BETWEEN ? AND ?`];
    const params = [from, to];
    if (isExpense && req.query.category) { where.push('LOWER(e.category) = ?'); params.push(String(req.query.category).toLowerCase()); }
    if (!isExpense && req.query.source) { where.push('e.source = ?'); params.push(req.query.source); }
    if (req.query.payment_mode) { where.push('e.payment_mode = ?'); params.push(req.query.payment_mode); }
    if (!isExpense && Number(req.query.client_id || 0) > 0) { where.push('e.client_id = ?'); params.push(req.query.client_id); }
    const [records] = await db.execute(`
      SELECT e.*, ${isExpense ? 'a.name AS created_by_name' : 'c.name AS selected_client, a.name AS created_by_name'}
      FROM ${table} e
      ${isExpense ? '' : 'LEFT JOIN clients c ON c.id = e.client_id'}
      LEFT JOIN admins a ON a.id = e.created_by
      WHERE ${where.join(' AND ')}
      ORDER BY e.${dateColumn} DESC, e.id DESC
    `, params);
    const [clients] = isExpense ? [[]] : await db.execute("SELECT id, name FROM clients WHERE status = 'active' ORDER BY name");
    const [summary] = await db.execute(`SELECT ${sourceColumn} AS label, COALESCE(SUM(amount),0) AS total FROM ${table} WHERE ${dateColumn} BETWEEN ? AND ? GROUP BY ${sourceColumn} ORDER BY total DESC`, [from, to]);
    const total = records.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const days = Math.max(1, ((new Date(to) - new Date(from)) / 86400000) + 1);
    return res.json({
      type: 'split-report',
      title: isExpense ? 'Daily Expenses' : 'Daily Earnings',
      filters: isExpense
        ? [{ type: 'date', name: 'from' }, { type: 'date', name: 'to' }, { type: 'select', name: 'category', options: [['', 'All Categories'], ...['salary', 'rent', 'electricity', 'transport', 'maintenance', 'raw material', 'office expense', 'other'].map((item) => [item, item.replace(/\b\w/g, (c) => c.toUpperCase())])] }, { type: 'select', name: 'payment_mode', options: [['', 'All Modes'], ...['Cash', 'Bank', 'UPI', 'Cheque'].map((item) => [item, item])] }]
        : [{ type: 'date', name: 'from' }, { type: 'date', name: 'to' }, { type: 'select', name: 'source', options: [['', 'All Sources'], ...['product sale', 'service', 'repair', 'advance payment', 'client payment', 'other'].map((item) => [item, item.replace(/\b\w/g, (c) => c.toUpperCase())])] }, { type: 'select', name: 'client_id', value: '0', options: [['0', 'All Clients'], ...clients.map((client) => [client.id, client.name])] }, { type: 'select', name: 'payment_mode', options: [['', 'All Modes'], ...['Cash', 'Bank', 'UPI', 'Cheque'].map((item) => [item, item])] }],
      buttons: ['Excel', 'PDF', isExpense ? 'Add Expense' : 'Add Earning'],
      metrics: [[isExpense ? 'Filtered Expense' : 'Filtered Earning', moneyString(total)], ['Daily Average', moneyString(total / days)], ['Entries', records.length]],
      mainTitle: isExpense ? 'Expense Entries' : 'Earning Entries',
      mainHeaders: isExpense ? ['Date', 'Category', 'Title', 'Amount', 'Mode', 'Paid To', 'Receipt', 'Created By', 'Action'] : ['Date', 'Source', 'Client', 'Reference', 'Amount', 'Mode', 'Created By', 'Action'],
      mainRows: records.map((row) => isExpense
        ? [row.expense_date, titleCase(row.category), row.title || row.remarks || '', moneyString(row.amount), row.payment_mode, row.paid_to || '', row.bill_upload ? 'View' : '', row.created_by_name || '', 'View Edit']
        : [row.earning_date, titleCase(row.source), row.selected_client || row.client_name || '', row.reference_no || '', moneyString(row.amount), row.payment_mode, row.created_by_name || '', 'View Edit']),
      sideTitle: isExpense ? 'Category-wise Report' : 'Source-wise Report',
      sideRows: summary.map((row) => [titleCase(row.label), moneyString(row.total)])
    });
  }

  if (screen === 'gst') {
    const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const to = req.query.to || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
    const [entries] = await db.execute('SELECT * FROM gst_ledger WHERE entry_date BETWEEN ? AND ? ORDER BY entry_date DESC, id DESC', [from, to]);
    const summary = { sales: 0, purchase: 0, cgst: 0, sgst: 0, igst: 0 };
    entries.forEach((entry) => {
      summary[entry.source_type] = Number(summary[entry.source_type] || 0) + Number(entry.total_gst || 0);
      summary.cgst += Number(entry.cgst || 0);
      summary.sgst += Number(entry.sgst || 0);
      summary.igst += Number(entry.igst || 0);
    });
    return res.json({
      type: 'gst-ledger',
      title: 'GST / Tax Ledger',
      filters: [{ type: 'date', name: 'from' }, { type: 'date', name: 'to' }],
      metrics: [['Output GST', moneyString(summary.sales)], ['Input GST', moneyString(summary.purchase)], ['CGST / SGST / IGST', `${moneyString(summary.cgst)} / ${moneyString(summary.sgst)} / ${moneyString(summary.igst)}`], ['Net GST Payable', moneyString(summary.sales - summary.purchase)]],
      headers: ['Date', 'Type', 'Reference ID', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total GST'],
      rows: entries.map((entry) => [entry.entry_date, entry.source_type, entry.source_id, moneyString(entry.taxable_amount), moneyString(entry.cgst), moneyString(entry.sgst), moneyString(entry.igst), moneyString(entry.total_gst)])
    });
  }

  if (!config) {
    return res.status(404).json({ message: 'Exact screen is not configured.' });
  }
  res.json({ type: 'table', config, rows });
}));

adminRouter.get('/:resource', asyncHandler(async (req, res) => {
  const table = tableMap[req.params.resource];
  const db = tenantDb(req.user.database);
  await ensureModuleRecords(db);
  const [customRows] = await db.execute('SELECT *, "custom" AS source FROM app_module_records WHERE module_key = ? ORDER BY id DESC LIMIT 100', [req.params.resource]);
  if (!table) {
    return res.json({ rows: customRows, generic: true });
  }
  try {
    const [rows] = await db.execute(`SELECT *, "table" AS source FROM \`${table}\` ORDER BY id DESC LIMIT 100`);
    return res.json({ rows: [...customRows, ...rows] });
  } catch {
    return res.json({ rows: customRows, generic: true });
  }
}));

adminRouter.post('/:resource', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureModuleRecords(db);
  await db.execute(
    'INSERT INTO app_module_records (module_key, title, owner, reference, status, description, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.params.resource, req.body.title || req.body.name || req.params.resource, req.body.owner || '', req.body.reference || '', req.body.status || 'active', req.body.description || '', JSON.stringify(req.body.metadata || {})]
  );
  res.json({ message: 'Saved.' });
}));

adminRouter.put('/:resource/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureModuleRecords(db);
  await db.execute(
    'UPDATE app_module_records SET title=?, owner=?, reference=?, status=?, description=?, metadata=? WHERE id=? AND module_key=?',
    [req.body.title || req.params.resource, req.body.owner || '', req.body.reference || '', req.body.status || 'active', req.body.description || '', JSON.stringify(req.body.metadata || {}), req.params.id, req.params.resource]
  );
  res.json({ message: 'Updated.' });
}));

adminRouter.delete('/:resource/:id', asyncHandler(async (req, res) => {
  const db = tenantDb(req.user.database);
  await ensureModuleRecords(db);
  await db.execute('DELETE FROM app_module_records WHERE id=? AND module_key=?', [req.params.id, req.params.resource]);
  res.json({ message: 'Deleted.' });
}));
