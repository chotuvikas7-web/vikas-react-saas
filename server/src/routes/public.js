import express from 'express';
import { env } from '../config/env.js';
import { tenantDb } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getActiveTheme, getCompanySettings } from '../services/themeService.js';

export const publicRouter = express.Router();

const today = () => new Date().toISOString().slice(0, 10);

async function columnsFor(db, table) {
  const [rows] = await db.execute(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [table]
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

function invoiceNo() {
  return `WEB-${today().replaceAll('-', '')}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
}

publicRouter.get('/bootstrap', asyncHandler(async (req, res) => {
  const settings = await getCompanySettings(env.dbName);
  const theme = await getActiveTheme();
  const [categories] = await tenantDb(env.dbName).execute("SELECT * FROM categories WHERE status = 'active' ORDER BY name LIMIT 12");
  res.json({ settings, theme, categories });
}));

publicRouter.get('/products', asyncHandler(async (req, res) => {
  const search = `%${req.query.search || req.query.q || ''}%`;
  const category = String(req.query.category || '');
  const sort = String(req.query.sort || 'latest');
  const where = ['p.status = "active"', '(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)'];
  const params = [search, search, search];

  if (category) {
    where.push('(c.slug = ? OR c.name = ?)');
    params.push(category, category);
  }

  const orderBy = {
    name: 'p.name ASC',
    'price-low': 'p.price ASC, p.name ASC',
    'price-high': 'p.price DESC, p.name ASC'
  }[sort] || 'p.created_at DESC, p.name ASC';

  const [rows] = await tenantDb(env.dbName).execute(
    `SELECT p.*, c.name AS category_name, c.name AS category, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT 120`,
    params
  );
  res.json({ rows });
}));

publicRouter.get('/products/:id', asyncHandler(async (req, res) => {
  const [rows] = await tenantDb(env.dbName).execute(
    `SELECT p.*, c.name AS category_name, c.name AS category, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE (p.id = ? OR p.slug = ?) AND p.status = 'active'
     LIMIT 1`,
    [req.params.id, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Product not found.' });
  const [images] = await tenantDb(env.dbName).execute('SELECT image_path FROM product_images WHERE product_id = ? ORDER BY id', [rows[0].id]);
  res.json({ product: rows[0], images });
}));

publicRouter.post('/cart/products', asyncHandler(async (req, res) => {
  const ids = [...new Set((req.body.items || []).map((item) => Number(item.id)).filter(Boolean))];
  if (!ids.length) return res.json({ rows: [] });
  const [rows] = await tenantDb(env.dbName).execute(
    `SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'active'`,
    ids
  );
  res.json({ rows });
}));

publicRouter.post('/enquiries', asyncHandler(async (req, res) => {
  const db = tenantDb(env.dbName);
  const cols = await columnsFor(db, 'enquiries');
  const enquiry = {
    product_id: req.body.product_id || null,
    name: String(req.body.name || '').trim(),
    mobile: String(req.body.mobile || '').trim(),
    email: String(req.body.email || '').trim(),
    subject: String(req.body.subject || 'Website enquiry').trim(),
    message: String(req.body.message || '').trim(),
    status: 'unread'
  };
  if (!enquiry.name || !enquiry.mobile) return res.status(422).json({ message: 'Name and mobile are required.' });
  const used = Object.keys(enquiry).filter((key) => cols.has(key));
  await db.execute(`INSERT INTO enquiries (${used.map((key) => `\`${key}\``).join(',')}) VALUES (${used.map(() => '?').join(',')})`, used.map((key) => enquiry[key]));
  res.json({ message: 'Enquiry sent. We will contact you shortly.' });
}));

publicRouter.post('/checkout', asyncHandler(async (req, res) => {
  const db = tenantDb(env.dbName);
  const items = (req.body.items || []).map((item) => ({ id: Number(item.id), quantity: Math.max(1, Number(item.quantity || 1)) })).filter((item) => item.id);
  if (!items.length) return res.status(422).json({ message: 'Cart is empty.' });

  const ids = items.map((item) => item.id);
  const [products] = await db.execute(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  if (!products.length) return res.status(422).json({ message: 'No valid products in cart.' });

  const customer = req.body.customer || {};
  const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.name || 'Website Customer';
  const address = [customer.street_address, customer.address_line_2, customer.city, customer.state, customer.zip_code, customer.country].filter(Boolean).join(', ');
  const number = invoiceNo();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const clientCols = await columnsFor(connection, 'clients');
    const client = { name, mobile: customer.mobile || '', email: customer.email || '', address, gst_number: customer.gst_number || '', status: 'active' };
    const clientUsed = Object.keys(client).filter((key) => clientCols.has(key));
    const [clientResult] = await connection.execute(`INSERT INTO clients (${clientUsed.map((key) => `\`${key}\``).join(',')}) VALUES (${clientUsed.map(() => '?').join(',')})`, clientUsed.map((key) => client[key]));

    let subtotal = 0;
    let gstTotal = 0;
    const productById = new Map(products.map((product) => [Number(product.id), product]));
    for (const item of items) {
      const product = productById.get(item.id);
      if (!product) continue;
      const taxable = item.quantity * Number(product.price || 0);
      const gstRate = Number(product.gst_rate || 18);
      subtotal += taxable;
      gstTotal += taxable * gstRate / 100;
    }
    const grandTotal = subtotal + gstTotal;
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (invoice_no, client_id, order_date, subtotal, gst_total, grand_total, payment_status, notes) VALUES (?,?,?,?,?,?,?,?)',
      [number, clientResult.insertId, today(), subtotal, gstTotal, grandTotal, 'Pending', 'Website checkout order']
    );

    for (const item of items) {
      const product = productById.get(item.id);
      if (!product) continue;
      const taxable = item.quantity * Number(product.price || 0);
      const gstRate = Number(product.gst_rate || 18);
      const lineTotal = taxable + taxable * gstRate / 100;
      await connection.execute('INSERT INTO order_items (order_id, product_id, quantity, price, discount, gst_rate, line_total) VALUES (?,?,?,?,?,?,?)', [orderResult.insertId, product.id, item.quantity, product.price || 0, 0, gstRate, lineTotal]);
      await connection.execute('UPDATE products SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?', [item.quantity, product.id]);
      await connection.execute('INSERT INTO stock_ledger (product_id, order_id, movement_date, movement_type, quantity, note) VALUES (?,?,?,?,?,?)', [product.id, orderResult.insertId, today(), 'sold', item.quantity, `Website order ${number}`]);
    }

    await connection.execute('INSERT INTO client_ledger (client_id, order_id, transaction_date, type, amount, description) VALUES (?,?,?,?,?,?)', [clientResult.insertId, orderResult.insertId, today(), 'debit', grandTotal, `Website order ${number}`]);
    await connection.commit();
    res.json({ message: 'Order placed successfully.', invoice_no: number });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));
