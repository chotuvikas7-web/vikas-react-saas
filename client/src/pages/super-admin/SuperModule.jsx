import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { DataTable } from '../../components/DataTable.jsx';
import { superResourceConfig } from '../../config/superResources.js';

const titleize = (value) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const planModules = ['plans', 'features', 'feature-limits', 'pricing-rules', 'coupons', 'plan-free', 'plan-starter', 'plan-business', 'plan-enterprise', 'module-access', 'custom-pricing'];
const subscriptionModules = ['active-subscriptions', 'trial-subscriptions', 'expired-subscriptions', 'renewals', 'upgrade-requests', 'downgrade-requests', 'cancelled-subscriptions'];
const billingModules = ['subscription-payments', 'billing-invoices', 'transactions', 'refunds', 'failed-payments', 'revenue-reports'];
const supportModules = ['support-tickets', 'ticket-categories', 'ticket-assignment', 'ticket-assignments', 'live-chat', 'live-chat-requests', 'contact-requests', 'knowledge-base'];
const integrationModules = ['payment-gateways', 'sms-gateway', 'email-smtp', 'whatsapp-api', 'google-services', 'webhooks', 'api-keys', 'razorpay', 'stripe', 'paypal'];
const securityModules = ['platform-roles', 'platform-login-logs', 'platform-audit-logs', 'security-events', 'ip-restrictions', 'two-factor-authentication', 'two-factor', 'compliance-logs', 'sessions'];
const settingsModules = ['platform-settings', 'branding', 'themes', 'smtp-settings', 'sms-settings', 'payment-settings', 'storage-settings', 'notification-settings'];
const maintenanceModules = ['backup-management', 'restore-management', 'database-monitoring', 'queue-monitoring', 'cron-jobs', 'cache-management', 'system-updates', 'error-logs'];
const companyModules = ['company-details', 'company-status', 'company-requests', 'suspended-companies', 'company-usage', 'company-storage'];
const userModules = ['all-users', 'vendor-admins', 'company-users', 'staff-users', 'super-admin-users', 'user-activity', 'login-history', 'user-permissions'];
const vendorModules = ['vendor-list', 'vendor-verification', 'vendor-kyc', 'vendor-documents', 'vendor-status', 'vendor-ratings'];
const analyticsModules = ['analytics-revenue', 'analytics-subscriptions', 'analytics-users', 'analytics-companies', 'analytics-tickets', 'analytics-growth', 'analytics-churn'];

function moduleType(module) {
  if (planModules.includes(module)) return 'plans';
  if (subscriptionModules.includes(module)) return 'subscriptions';
  if (billingModules.includes(module)) return 'billing';
  if (supportModules.includes(module)) return 'support';
  if (integrationModules.includes(module)) return 'integrations';
  if (securityModules.includes(module)) return 'security';
  if (settingsModules.includes(module)) return 'settings';
  if (maintenanceModules.includes(module)) return 'maintenance';
  if (companyModules.includes(module)) return 'companies';
  if (userModules.includes(module)) return 'users';
  if (vendorModules.includes(module)) return 'vendors';
  if (analyticsModules.includes(module)) return 'analytics';
  return 'records';
}

const copyByType = {
  plans: ['Plan Name', 'Plans List', 'Create and manage SaaS pricing plans'],
  subscriptions: ['Subscription', 'Subscriptions List', 'Track active, trial, expired and renewal subscriptions'],
  billing: ['Payment Invoice No.', 'Billing Ledger', 'Invoices, payments, refunds and failed payment recovery'],
  support: ['Ticket Subject', 'Status Timeline', 'Reply, assign, close and document support cases'],
  integrations: ['Provider', 'Integration Logs', 'Credentials, webhook and status controls'],
  security: ['Security Item', 'Security Events', 'Permissions, login logs, sessions and IP controls'],
  settings: ['Setting Name', 'Saved Configuration', 'Configure settings for the full SaaS platform'],
  maintenance: ['Maintenance Job', 'Maintenance Jobs', 'Backups, queues, cron, cache and platform checks'],
  companies: ['Company Name', 'Company Workspace', 'View, edit, delete and login as tenant company admins'],
  users: ['User Name', 'Users Workspace', 'Manage platform and tenant user access'],
  vendors: ['Vendor Name', 'Vendor Workspace', 'Manage vendor profiles, KYC and status'],
  analytics: ['Report Name', 'Reports Workspace', 'Operational analytics snapshot for this report'],
  records: ['Record Title', 'Records List', 'Manage platform records']
};

const fieldSets = {
  plans: ['record_title', 'plan_id', 'monthly_price', 'annual_price', 'user_limit', 'storage_limit_mb', 'module_name', 'status'],
  subscriptions: ['record_title', 'company', 'plan_id', 'billing_cycle', 'amount', 'started_at', 'renews_at', 'ends_at', 'status'],
  billing: ['record_title', 'invoice_no', 'amount', 'payment_status', 'payment_gateway', 'transaction_ref', 'paid_at'],
  support: ['record_title', 'company', 'category', 'priority', 'assigned_to', 'status'],
  integrations: ['record_title', 'provider', 'category', 'api_key', 'webhook_url', 'status'],
  security: ['record_title', 'owner', 'reference', 'priority', 'status'],
  settings: ['record_title', 'setting_key', 'setting_value', 'status'],
  maintenance: ['record_title', 'job_type', 'message', 'started_at', 'finished_at', 'status'],
  companies: ['record_title', 'owner', 'reference', 'amount', 'due_date', 'status'],
  users: ['record_title', 'user_name', 'email', 'role', 'module_name', 'status'],
  vendors: ['record_title', 'owner', 'reference', 'amount', 'due_date', 'status'],
  analytics: ['record_title', 'period', 'plan', 'amount', 'status'],
  records: ['record_title', 'owner', 'reference', 'amount', 'due_date', 'status']
};

const fieldLabels = {
  record_title: 'Title',
  plan_id: 'Plan / Company',
  monthly_price: 'Monthly',
  annual_price: 'Annual',
  user_limit: 'Users',
  storage_limit_mb: 'Storage MB',
  module_name: 'Module',
  company: 'Company / Scope',
  billing_cycle: 'Billing Cycle',
  amount: 'Amount / Score',
  started_at: 'Start',
  renews_at: 'Renew',
  ends_at: 'End',
  invoice_no: 'Invoice / Payment No.',
  payment_status: 'Status',
  payment_gateway: 'Gateway',
  transaction_ref: 'Transaction Ref',
  paid_at: 'Paid At',
  category: 'Category',
  priority: 'Priority',
  assigned_to: 'Assigned To / Author',
  provider: 'Provider',
  api_key: 'API Key / Token',
  webhook_url: 'Webhook URL',
  owner: 'Owner',
  reference: 'Reference',
  setting_key: 'Config Key',
  setting_value: 'Value / Mode',
  job_type: 'Job Type',
  message: 'Message',
  finished_at: 'Finished',
  due_date: 'Due / Review Date',
  user_name: 'User Name',
  email: 'Email',
  role: 'Role',
  period: 'Period',
  plan: 'Plan'
};

const selectOptions = {
  status: ['active', 'pending', 'approved', 'blocked', 'resolved', 'inactive'],
  payment_status: ['paid', 'pending', 'failed', 'refunded'],
  priority: ['low', 'medium', 'high', 'urgent'],
  billing_cycle: ['monthly', 'annual']
};

const statusCount = (rows, status) => rows.filter((row) => String(row.status || row.payment_status || '').toLowerCase().includes(status)).length;
const metaFrom = (row) => {
  if (!row?.metadata) return {};
  try {
    return typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
  } catch {
    return {};
  }
};
const cleanJsonScalar = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const normalizeRow = (row) => {
  const metadata = metaFrom(row);
  return {
    ...row,
    ...metadata,
    metadata,
    owner: cleanJsonScalar(row.owner) || metadata.owner,
    reference: cleanJsonScalar(row.reference) || metadata.reference,
    setting_key: metadata.setting_key,
    setting_value: metadata.setting_value,
    priority: metadata.priority || row.priority
  };
};

function valueFor(row, field) {
  const meta = metaFrom(row);
  if (field === 'record_title') return row?.title || row?.name || row?.subject || row?.company_name || '';
  return row?.[field] ?? meta[field] ?? meta[field.replace('_', '-')] ?? '';
}

function fieldType(field) {
  if (['amount', 'monthly_price', 'annual_price', 'user_limit', 'storage_limit_mb'].includes(field)) return 'number';
  if (['started_at', 'renews_at', 'ends_at', 'due_date'].includes(field)) return 'date';
  if (['paid_at', 'finished_at'].includes(field)) return 'datetime-local';
  return 'text';
}

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <div className={`super-panel ${className}`}>
      <div className="super-panel-head"><h2>{title}</h2><span>{subtitle}</span></div>
      {children}
    </div>
  );
}

function ViewModal({ record, onClose }) {
  if (!record) return null;
  const body = record.description || JSON.stringify({ ...record, metadata: metaFrom(record) }, null, 2);
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title h5">{record.title || record.name || 'Record Detail'}</h2><button type="button" className="btn-close" onClick={onClose} aria-label="Close" /></div>
            <pre className="modal-body mb-0" style={{ whiteSpace: 'pre-wrap' }}>{body}</pre>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function ModuleForm({ type, title, record, onCancel, onSubmit }) {
  const fields = fieldSets[type] || fieldSets.records;
  return (
    <form className="super-panel" onSubmit={(event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      onSubmit(values);
    }}>
      <div className="super-panel-head"><h2>{record?.id ? `Edit ${copyByType[type][0]}` : `Add ${copyByType[type][0]}`}</h2><span>{title} specific controls</span></div>
      <div className="row g-3">
        {fields.map((field) => (
          <label className={field === 'message' ? 'col-12' : 'col-md-6 col-xl-4'} key={field}>
            <span className="form-label">{fieldLabels[field] || titleize(field)}</span>
            {field === 'message'
              ? <textarea className="form-control" name={field} rows="4" defaultValue={valueFor(record, field)} />
              : selectOptions[field]
                ? (
                  <select className="form-select" name={field} defaultValue={valueFor(record, field) || selectOptions[field][0]}>
                    {selectOptions[field].map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                )
                : <input className="form-control" name={field} type={fieldType(field)} step={fieldType(field) === 'number' ? '0.01' : undefined} defaultValue={valueFor(record, field)} required={field === 'record_title'} />}
          </label>
        ))}
        <label className="col-12">
          <span className="form-label">Notes</span>
          <textarea className="form-control" name="description" rows="3" defaultValue={record?.description || ''} />
        </label>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary">{record?.id ? 'Update' : type === 'settings' ? 'Save Settings' : type === 'integrations' ? 'Save Integration' : 'Add'}</button>
        {record?.id && <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function PriorityView({ type, module, title, rows, editRecord, onEdit, onCancel, onSubmit }) {
  if (type === 'integrations') {
    const providers = { 'payment-gateways': ['Razorpay', 'Stripe', 'PayPal'], 'sms-gateway': ['MSG91', 'TextLocal', 'Twilio'], 'email-smtp': ['SMTP', 'SendGrid', 'Mailgun'], 'whatsapp-api': ['Meta Cloud', 'Gupshup', 'Interakt'], 'google-services': ['OAuth', 'Maps', 'Analytics'] }[module] || [title, 'Webhook', 'API'];
    return (
      <div className="row g-3">
        {providers.map((provider) => <div className="col-xl-4 col-md-6" key={provider}><Panel title={provider} subtitle="Connection card" className="h-100"><div className="d-flex justify-content-between mb-3"><span>Status</span><span className="badge text-bg-success">Configured</span></div><div className="d-grid gap-2"><button className="btn btn-primary btn-sm" type="button">Configure</button><button className="btn btn-outline-secondary btn-sm" type="button">Test Connection</button><button className="btn btn-outline-secondary btn-sm" type="button">View Logs</button></div></Panel></div>)}
        <div className="col-12"><ModuleForm type={type} title={`Configure ${title}`} record={editRecord} onCancel={onCancel} onSubmit={onSubmit} /></div>
        <div className="col-12"><Panel title="Integration Logs" subtitle="Recent configuration and connection attempts."><DataTable rows={rows} columns={['provider', 'category', 'status', 'updated_at']} onView={onEdit} onEdit={onEdit} /></Panel></div>
      </div>
    );
  }
  if (type === 'settings' || type === 'security') {
    return (
      <div className="row g-3">
        <div className="col-xl-5"><ModuleForm type={type} title={title} record={editRecord} onCancel={onCancel} onSubmit={onSubmit} /></div>
        <div className="col-xl-7"><Panel title={type === 'security' ? 'Role Permission Matrix' : `${title} Controls`} subtitle={type === 'security' ? 'Read, create, edit and delete permissions by admin role.' : 'Expected controls for this settings screen.'} className="h-100">
          <div className="row g-3">
            {(type === 'security' ? ['Super Admin', 'Platform Manager', 'Billing Manager', 'Support Manager', 'Technical Admin', 'Read Only Admin'] : (fieldSets[type] || []).slice(1)).map((field) => (
              <div className="col-md-6" key={field}><div className="border rounded-3 p-3 bg-light"><strong>{fieldLabels[field] || field}</strong><br /><small className="text-muted">Configure and test {(fieldLabels[field] || field).toLowerCase()}</small></div></div>
            ))}
          </div>
        </Panel></div>
        <div className="col-12"><Panel title={type === 'security' ? `${title} Events` : 'Saved Configuration'} subtitle={type === 'security' ? 'Login logs, audit logs, sessions and IP restrictions.' : 'Audit-ready settings entries.'}><DataTable rows={rows} columns={type === 'security' ? ['title', 'owner', 'reference', 'priority', 'status'] : ['title', 'setting_key', 'setting_value', 'status', 'updated_at']} onView={onEdit} onEdit={onEdit} /></Panel></div>
      </div>
    );
  }
  if (type === 'billing' || type === 'support') {
    return (
      <div className="row g-3">
        {type === 'billing' && [
          ['Total Amount', rows.reduce((sum, row) => sum + Number(row.amount || 0), 0).toLocaleString('en-IN')],
          ['Paid', statusCount(rows, 'paid')],
          ['Pending', statusCount(rows, 'pending')],
          ['Failed/Refunds', statusCount(rows, 'failed') + statusCount(rows, 'refund')]
        ].map(([label, value]) => <div className="col-xl-3 col-md-6" key={label}><div className="super-kpi-card"><span>{label}</span><strong>{value}</strong></div></div>)}
        {type === 'support' && <div className="col-xl-4"><Panel title="Ticket Inbox" subtitle="Priority queue and assignment list." className="h-100">{rows.slice(0, 6).map((row) => <div className="border rounded-3 p-3 mb-2" key={row.id}><strong>{row.subject || row.title || '-'}</strong><div className="small text-muted">{row.category || '-'} · {row.assigned_to || 'Unassigned'}</div></div>)}{!rows.length && <p className="text-muted mb-0">No tickets yet.</p>}</Panel></div>}
        <div className={type === 'support' ? 'col-xl-8' : 'col-12'}><ModuleForm type={type} title={title} record={editRecord} onCancel={onCancel} onSubmit={onSubmit} /></div>
        <div className="col-12"><Panel title={type === 'billing' ? `${title} Ledger` : 'Status Timeline'} subtitle={copyByType[type][2]}><DataTable rows={rows} columns={superResourceConfig(module).columns} onView={onEdit} onEdit={onEdit} /></Panel></div>
      </div>
    );
  }
  return null;
}

export function SuperModule() {
  const { module = 'company-details' } = useParams();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const title = useMemo(() => titleize(module), [module]);
  const type = moduleType(module);
  const config = superResourceConfig(module);
  const copy = copyByType[type] || copyByType.records;
  const endpoint = `/super-admin/modules/${module}`;
  const load = () => api(endpoint).then((data) => setRows((data.rows || []).map(normalizeRow))).catch(() => setRows([]));

  useEffect(() => {
    setEditRecord(null);
    setViewRecord(null);
    load();
  }, [module]);

  const visibleRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const cards = [
    ['Total Records', visibleRows.length, 'bi-collection', 'primary'],
    ['Active / Paid', statusCount(rows, 'active') + statusCount(rows, 'paid'), 'bi-check-circle', 'success'],
    ['Pending', statusCount(rows, 'pending'), 'bi-hourglass-split', 'warning'],
    ['Issues / Failed', statusCount(rows, 'failed') + statusCount(rows, 'suspended'), 'bi-exclamation-triangle', 'danger']
  ];

  const save = async (values) => {
    const metadata = { ...values };
    delete metadata.record_title;
    delete metadata.description;
    delete metadata.status;
    const body = {
      title: values.record_title,
      status: values.status || values.payment_status || 'active',
      description: values.description || '',
      metadata
    };
    const method = editRecord?.id && editRecord?.module_key ? 'PUT' : 'POST';
    const path = method === 'PUT' ? `/super-admin/modules/${module}/${editRecord.id}` : `/super-admin/modules/${module}`;
    await api(path, { method, body: JSON.stringify(body) });
    setEditRecord(null);
    load();
  };

  const remove = async (record) => {
    if (!record?.module_key) {
      setViewRecord({ ...record, title: record.title || 'Read Only Record', description: 'This row comes from the source SaaS table. The React conversion currently mirrors the PHP view and supports custom super-admin records for save/delete.' });
      return;
    }
    if (!confirm('Delete this entry?')) return;
    await api(`/super-admin/modules/${module}/${record.id}`, { method: 'DELETE' });
    load();
  };

  const priority = PriorityView({ type, module, title, rows: visibleRows, editRecord, onEdit: (record) => { setViewRecord(record); setEditRecord(record); }, onCancel: () => setEditRecord(null), onSubmit: save });

  return (
    <>
      <section className="super-module-hero mb-3">
        <i className="bi bi-grid-3x3-gap" />
        <div><strong>{title}</strong><p>{config.help || copy[2]}</p></div>
      </section>

      <section className="super-kpi-grid mb-3">
        {cards.map(([label, value, icon, tone]) => (
          <div className="super-kpi-card" key={label}>
            <div className={`super-kpi-icon is-${tone}`}><i className={`bi ${icon}`} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="super-panel p-3 mb-3">
        <div className="row g-3">
          {['Search', 'Status', 'Date Range', 'Company'].map((filter) => (
            <label className="col-md-6 col-xl-3" key={filter}>
              <span className="form-label">{filter}</span>
              <input className="form-control" placeholder={filter === 'Search' ? `Search ${title}` : filter} value={filter === 'Search' ? query : ''} onChange={filter === 'Search' ? (event) => setQuery(event.target.value) : undefined} readOnly={filter !== 'Search'} />
            </label>
          ))}
        </div>
      </section>

      {priority || (
        <div className="row g-3">
          <div className="col-xl-4">
            <ModuleForm type={type} title={title} record={editRecord} onCancel={() => setEditRecord(null)} onSubmit={save} />
          </div>
          <div className="col-xl-8">
            <Panel title={copy[1]} subtitle={`Dedicated ${type} operations with view/edit/delete controls`} className="h-100">
              <div className="row g-3 mb-3">
                {(config.charts || ['Operational Snapshot', 'Status Breakdown']).slice(0, 2).map((chart) => (
                  <div className="col-md-6" key={chart}><div className="super-chart-placeholder"><i className="bi bi-bar-chart-line" /><span>{chart}</span></div></div>
                ))}
              </div>
              <DataTable rows={visibleRows} columns={config.columns} onView={setViewRecord} onEdit={setEditRecord} onDelete={remove} />
            </Panel>
          </div>
        </div>
      )}

      <div className="super-table-toolbar mt-3">
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setEditRecord({})}><i className="bi bi-plus-circle" /> Add {title}</button>
          <button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-funnel" /> Advanced Filters</button>
          <button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-list-check" /> Bulk Actions</button>
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(visibleRows, null, 2))}><i className="bi bi-download" /> Export</button>
        </div>
        <input className="form-control w-auto" placeholder="Filter without refresh" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </>
  );
}
