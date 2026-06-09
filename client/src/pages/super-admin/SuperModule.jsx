import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
const companyModules = ['all-companies', 'company-details', 'company-status', 'company-requests', 'suspended-companies', 'company-usage', 'company-storage'];
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
const companyStatus = (value) => String(value || 'active').toLowerCase();
const companyPlans = [
  { value: '1', label: 'Basic' },
  { value: '2', label: 'Professional' },
  { value: '3', label: 'Enterprise' }
];
const companyStatuses = ['active', 'trial', 'suspended', 'inactive'];
const companyStatusCount = (rows, status) => rows.filter((row) => companyStatus(row.status) === status).length;
const companyPlanLabel = (value, name) => name || companyPlans.find((plan) => String(plan.value) === String(value))?.label || titleize(String(value || 'Basic'));
const companyDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
const companyCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const companyDaysUntil = (value) => {
  if (!value) return null;
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
};
const activityTone = (status) => {
  const label = String(status || '').toLowerCase();
  if (label.includes('info')) return 'info';
  if (label.includes('invoice')) return 'invoice';
  return 'success';
};
const companyStorage = (value) => `${(Number(value || 0) / 1024).toFixed(2)} GB`;
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

function CompanyFormModal({ record, onClose, onSubmit }) {
  if (!record) return null;
  const submit = (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  };
  return (
    <>
      <div className="modal fade company-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <form className="modal-content" onSubmit={submit}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title h5">{record.id ? 'Edit Company' : 'Add Company'}</h2>
                <p className="text-muted mb-0">Fill company details and save tenant information.</p>
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="company-form-grid">
                <label><span>Company Name <b>*</b></span><input className="form-control" name="company_name" defaultValue={record.company_name || record.title || ''} placeholder="Enter company name" required /></label>
                <label><span>Owner <b>*</b></span><input className="form-control" name="owner_name" defaultValue={record.owner_name || record.owner || ''} placeholder="Enter owner name" required /></label>
                <label><span>Reference / Code</span><input className="form-control" name="slug" defaultValue={record.slug || record.reference || ''} placeholder="Enter reference code" /></label>
                <label><span>Email</span><input className="form-control" type="email" name="owner_email" defaultValue={record.owner_email || record.email || ''} placeholder="Enter email address" /></label>
                <label><span>Phone</span><input className="form-control" name="phone" defaultValue={record.phone || record.owner_phone || ''} placeholder="Enter phone number" /></label>
                <label><span>Website</span><input className="form-control" name="website" defaultValue={record.website || ''} placeholder="Enter website URL" /></label>
                <label><span>Plan</span><select className="form-select" name="plan_id" defaultValue={record.plan_id || record.plan || '2'}>{companyPlans.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}</select></label>
                <label><span>Storage Used MB</span><input className="form-control" type="number" step="0.01" name="storage_used_mb" defaultValue={record.storage_used_mb || 0} placeholder="Enter storage used" /></label>
                <label><span>Due / Review Date</span><input className="form-control" type="date" name="subscription_ends_at" defaultValue={String(record.subscription_ends_at || record.due_date || '').slice(0, 10)} /></label>
                <label><span>Status</span><select className="form-select" name="status" defaultValue={companyStatus(record.status)}>{companyStatuses.map((status) => <option key={status} value={status}>{titleize(status)}</option>)}</select></label>
                <label className="company-field-wide"><span>Notes</span><textarea className="form-control" name="description" rows="4" defaultValue={record.description || ''} placeholder="Enter notes (optional)" /></label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary">Save Company</button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function CompanyViewModal({ record, onClose }) {
  if (!record) return null;
  return (
    <>
      <div className="modal fade company-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title h5">Company Details</h2><button type="button" className="btn-close" onClick={onClose} aria-label="Close" /></div>
            <div className="modal-body">
              <div className="company-view-grid">
                {[
                  ['Company', record.company_name || record.title],
                  ['Owner', record.owner_name || record.owner],
                  ['Email', record.owner_email],
                  ['Plan', companyPlanLabel(record.plan_id, record.plan_name)],
                  ['Storage', `${Number(record.storage_used_mb || 0).toFixed(2)} MB`],
                  ['Status', titleize(companyStatus(record.status))],
                  ['Subscription Ends', record.subscription_ends_at || '-'],
                  ['Reference', record.slug || record.reference || '-']
                ].map(([label, value]) => <span key={label}><small>{label}</small><strong>{value || '-'}</strong></span>)}
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button></div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function CompanyDetailsScreen({ rows, load }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState(null);
  const [formRecord, setFormRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [message, setMessage] = useState(null);

  const companies = useMemo(() => rows.filter((row) => !row.module_key), [rows]);
  const filteredRows = useMemo(() => companies.filter((row) => {
    const haystack = JSON.stringify(row).toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (!status || companyStatus(row.status) === status)
      && (!plan || String(row.plan_id || '').toLowerCase() === plan);
  }), [companies, plan, query, status]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = filteredRows.length ? (currentPage - 1) * pageSize : 0;
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize);
  const storageGb = companies.reduce((sum, row) => sum + Number(row.storage_used_mb || 0), 0) / 1024;
  const selectedCompany = filteredRows[0] || companies[0] || {};
  const selectedInitials = String(selectedCompany.company_name || 'CO').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  useEffect(() => {
    setPage(1);
  }, [query, status, plan, pageSize]);

  const save = async (values) => {
    const method = formRecord?.id ? 'PUT' : 'POST';
    const path = formRecord?.id ? `/super-admin/modules/company-details/${formRecord.id}` : '/super-admin/modules/company-details';
    await api(path, { method, body: JSON.stringify(values) });
    setFormRecord(null);
    setMessage({ type: 'success', text: formRecord?.id ? 'Company updated.' : 'Company added.' });
    load();
  };

  const remove = async (row) => {
    if (!confirm(`Delete ${row.company_name || row.title}?`)) return;
    try {
      await api(`/super-admin/modules/company-details/${row.id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Company deleted.' });
      setMenuId(null);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Company delete failed.' });
    }
  };

  const toggleStatus = async (row) => {
    const next = companyStatus(row.status) === 'active' ? 'suspended' : 'active';
    try {
      await api(`/super-admin/modules/company-details/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, status: next }) });
      setMessage({ type: 'success', text: `Company ${next === 'active' ? 'activated' : 'suspended'}.` });
      setMenuId(null);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Status update failed.' });
    }
  };

  return (
    <section className="company-details-page">
      {message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : null}
      {selectedCompany.id ? (
        <div className="company-profile-overview">
          <div className="company-breadcrumb">Tenant Management <i className="bi bi-chevron-right" /> All Companies <i className="bi bi-chevron-right" /> <strong>Company Details</strong></div>
          <div className="company-profile-head">
            <span className="company-profile-avatar">{selectedInitials}</span>
            <div className="company-profile-title">
              <h2>{selectedCompany.company_name || selectedCompany.title}</h2>
              <p>{companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)} <b>•</b> Customer ID: CMP-{String(selectedCompany.id).padStart(6, '0')} <b>•</b> Registered on: {companyDate(selectedCompany.created_at)}</p>
            </div>
            <span className={`company-status-pill is-${companyStatus(selectedCompany.status)}`}>{titleize(companyStatus(selectedCompany.status))}</span>
            <div className="company-profile-actions">
              <button className="btn btn-outline-primary btn-sm" type="button"><i className="bi bi-box-arrow-in-right" /> Login as Company</button>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setFormRecord(selectedCompany)}><i className="bi bi-pencil" /> Edit Company</button>
            </div>
          </div>
          <div className="company-profile-stats">
            {[
              ['Users', '25', 'Total Users', 'bi-people', 'primary'],
              ['Storage', companyStorage(selectedCompany.storage_used_mb), 'Used Storage', 'bi-archive', 'success'],
              ['Logins', '1,248', 'Total Logins', 'bi-person-check', 'warning'],
              ['Revenue', 'Rs. 24,320', 'Total Spent', 'bi-shield-check', 'purple']
            ].map(([label, value, sub, icon, tone]) => <span key={label} className={`is-${tone}`}><i className={`bi ${icon}`} /><small>{label}</small><strong>{value}</strong><em>{sub}</em></span>)}
          </div>
          <div className="company-tabs">
            {['Overview', 'Subscription', 'Users (25)', 'Usage', 'Storage', 'Activity', 'Invoices (18)', 'Settings'].map((tab, index) => <button className={index === 0 ? 'active' : ''} type="button" key={tab}>{tab}</button>)}
          </div>
        </div>
      ) : null}
      <div className="company-kpi-grid">
        {[
          ['Total Companies', companies.length, 'All registered companies', 'bi-buildings', 'primary'],
          ['Active', companyStatusCount(companies, 'active'), 'Active and operational', 'bi-bag-check', 'success'],
          ['Trial', companyStatusCount(companies, 'trial'), 'In trial period', 'bi-shield-check', 'warning'],
          ['Suspended', companyStatusCount(companies, 'suspended'), 'Currently suspended', 'bi-exclamation-octagon', 'danger'],
          ['Storage Used', `${storageGb.toFixed(2)} GB`, 'Total space utilized', 'bi-briefcase', 'primary']
        ].map(([label, value, sub, icon, tone]) => <article className="company-kpi-card" key={label}><span className={`is-${tone}`}><i className={`bi ${icon}`} /></span><p>{label}</p><strong>{value}</strong><small>{sub}</small></article>)}
      </div>
      <div className="company-filter-panel">
        <label><span>Search</span><div className="company-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by company name, email..." /><i className="bi bi-search" /></div></label>
        <label><span>Status</span><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Statuses</option>{companyStatuses.map((item) => <option key={item} value={item}>{titleize(item)}</option>)}</select></label>
        <label><span>Plan</span><select className="form-select" value={plan} onChange={(event) => setPlan(event.target.value)}><option value="">All Plans</option>{companyPlans.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span>Date Range</span><input className="form-control" type="date" /></label>
        <label><span>Owner</span><select className="form-select"><option>All Owners</option></select></label>
        <div className="company-filter-actions"><button className="btn btn-outline-secondary" type="button" onClick={() => { setQuery(''); setStatus(''); setPlan(''); }}>Clear</button><button className="btn btn-primary" type="button">Apply Filters</button></div>
      </div>
      {selectedCompany.id ? (
        <div className="company-detail-grid">
          <section className="company-info-panel">
            <div className="company-panel-head"><div><h2>Company Information</h2></div><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => setViewRecord(selectedCompany)}>View More Details</button></div>
            <div className="company-info-list">
              {[
                ['Company Name', selectedCompany.company_name || selectedCompany.title],
                ['Owner Name', selectedCompany.owner_name || selectedCompany.owner],
                ['Email', selectedCompany.owner_email || selectedCompany.email],
                ['Phone', selectedCompany.phone || selectedCompany.owner_phone],
                ['Website', selectedCompany.website || '-'],
                ['Industry', selectedCompany.industry || 'Information Technology'],
                ['Country', selectedCompany.country || 'India'],
                ['State', selectedCompany.state || '-'],
                ['City', selectedCompany.city || '-'],
                ['GST Number', selectedCompany.gst_number || '-'],
                ['Registered On', companyDate(selectedCompany.created_at)],
                ['Reference Code', selectedCompany.slug || selectedCompany.reference]
              ].map(([label, value]) => <span key={label}><small>{label}</small><strong>{value || '-'}</strong></span>)}
            </div>
          </section>
          <section className="company-side-panel">
            <div className="company-panel-head"><div><h2>Subscription & Plan</h2></div><span className="company-plan-pill">{companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)}</span></div>
            {[
              ['Plan', companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)],
              ['Billing Cycle', 'Monthly'],
              ['Amount', 'Rs. 24,999 / month'],
              ['Next Billing Date', companyDate(selectedCompany.subscription_ends_at)],
              ['Renewal Date', companyDate(selectedCompany.subscription_ends_at)],
              ['Payment Method', '•••• •••• •••• 4242']
            ].map(([label, value]) => <div className="company-side-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            <button className="btn btn-outline-primary btn-sm w-100" type="button">Manage Subscription</button>
          </section>
        </div>
      ) : null}
      <div className="company-workspace-panel">
        <div className="company-panel-head"><div><h2>Company Workspace</h2><p>Overview and quick insights</p></div><button className="btn btn-outline-primary btn-sm"><i className="bi bi-download" /> View Analytics</button></div>
        <div className="company-chart-grid"><div className="company-chart-line"><span>Operational Snapshot</span><svg viewBox="0 0 520 120" preserveAspectRatio="none"><path d="M0 70 C45 25 75 40 110 70 S175 105 230 48 310 35 355 82 425 115 520 44" /></svg></div><div className="company-chart-donut"><span>Status Breakdown</span><div className="donut" /><ul><li>Active <b>{companyStatusCount(companies, 'active')}</b></li><li>Trial <b>{companyStatusCount(companies, 'trial')}</b></li><li>Suspended <b>{companyStatusCount(companies, 'suspended')}</b></li><li>Inactive <b>{companyStatusCount(companies, 'inactive')}</b></li></ul></div></div>
      </div>
      <div className="company-table-panel">
        <div className="company-table-head"><div><h2>Companies ({filteredRows.length})</h2></div><div className="d-flex gap-2"><button className="btn btn-outline-secondary btn-sm"><i className="bi bi-download" /> Export</button><button className="btn btn-outline-secondary btn-sm"><i className="bi bi-gear" /> Column</button></div></div>
        <div className="app-table-toolbar"><div className="app-table-length"><span>Show</span><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option>5</option><option>10</option><option>25</option></select><span>entries</span></div></div>
        <div className="table-responsive app-table-responsive">
          <table className="table admin-data-table company-table align-middle">
            <thead><tr>{['#', 'Company Name', 'Owner', 'Plan', 'Storage Used', 'Status', 'Subscription Ends', 'Actions'].map((head) => <th key={head} className={head === 'Actions' ? 'text-end' : ''}>{head}</th>)}</tr></thead>
            <tbody>{visibleRows.map((row, index) => {
              const initials = String(row.company_name || 'CO').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
              const rowStatus = companyStatus(row.status);
              return <tr key={row.id}><td>{startIndex + index + 1}</td><td><div className="company-name-cell"><span>{initials}</span><strong>{row.company_name || row.title}<small>{row.owner_email}</small></strong></div></td><td>{row.owner_name || row.owner || '-'}<small className="d-block text-muted">{row.owner_email}</small></td><td><span className="company-plan-pill">{companyPlanLabel(row.plan_id, row.plan_name)}</span></td><td>{Number(row.storage_used_mb || 0).toFixed(2)} MB<div className="company-storage-track"><span style={{ width: `${Math.min(100, Number(row.storage_used_mb || 0) / 2)}%` }} /></div></td><td><span className={`company-status-pill is-${rowStatus}`}>{titleize(rowStatus)}</span></td><td>{row.subscription_ends_at || '-'}</td><td className="text-end"><div className="company-actions"><button className="company-row-icon" type="button" onClick={() => setMenuId(menuId === row.id ? null : row.id)}><i className="bi bi-three-dots-vertical" /></button>{menuId === row.id ? <div className="company-action-menu"><button type="button" onClick={() => { setViewRecord(row); setMenuId(null); }}><i className="bi bi-eye" /> View</button><button type="button" onClick={() => { setFormRecord(row); setMenuId(null); }}><i className="bi bi-pencil" /> Edit</button><button type="button" onClick={() => toggleStatus(row)}><i className={`bi ${rowStatus === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`} /> {rowStatus === 'active' ? 'Suspend' : 'Activate'}</button><button type="button" onClick={() => remove(row)}><i className="bi bi-trash3" /> Delete</button></div> : null}</div></td></tr>;
            })}</tbody>
          </table>
        </div>
        <div className="app-table-footer"><span>Showing {filteredRows.length ? startIndex + 1 : 0} to {startIndex + visibleRows.length} of {filteredRows.length} entries</span><nav><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><i className="bi bi-chevron-left" /></button><button className="is-active">{currentPage}</button><button disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><i className="bi bi-chevron-right" /></button></nav></div>
      </div>
      <CompanyFormModal record={formRecord} onClose={() => setFormRecord(null)} onSubmit={save} />
      <CompanyViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </section>
  );
}

function CompanyDetailsExactScreen({ rows, load }) {
  const [searchParams] = useSearchParams();
  const [showActions, setShowActions] = useState(false);
  const [formRecord, setFormRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [message, setMessage] = useState(null);
  const companies = useMemo(() => rows.filter((row) => !row.module_key), [rows]);
  const selectedId = searchParams.get('company');
  const selectedCompany = companies.find((row) => String(row.id) === String(selectedId)) || companies[0] || {};
  const currentStatus = companyStatus(selectedCompany.status);
  const selectedInitials = String(selectedCompany.company_name || 'CO').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const usersCount = Number(selectedCompany.users_count || selectedCompany.user_count || 25);
  const storageUsedGb = Number(selectedCompany.storage_used_mb || 49520) / 1024;
  const storageTotalGb = Number(selectedCompany.storage_limit_gb || 100);
  const storagePercent = Math.min(100, Math.max(0, Math.round((storageUsedGb / storageTotalGb) * 100)));

  const save = async (values) => {
    const path = `/super-admin/modules/company-details/${formRecord.id}`;
    await api(path, { method: 'PUT', body: JSON.stringify(values) });
    setFormRecord(null);
    setMessage({ type: 'success', text: 'Company updated.' });
    await load();
  };

  const remove = async (row) => {
    if (!confirm(`Delete ${row.company_name || row.title}?`)) return;
    try {
      await api(`/super-admin/modules/company-details/${row.id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Company deleted.' });
      setShowActions(false);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Company delete failed.' });
    }
  };

  const toggleStatus = async (row) => {
    const next = companyStatus(row.status) === 'active' ? 'suspended' : 'active';
    try {
      await api(`/super-admin/modules/company-details/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, status: next }) });
      setMessage({ type: 'success', text: `Company ${next === 'active' ? 'activated' : 'suspended'}.` });
      setShowActions(false);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Status update failed.' });
    }
  };

  if (!selectedCompany.id) {
    return <section className="company-details-page"><div className="company-info-panel"><h2>No company found</h2><p className="mb-0 text-muted">No tenant company details are available.</p></div></section>;
  }

  const billingDate = selectedCompany.subscription_ends_at || selectedCompany.due_date;
  const billingDays = companyDaysUntil(billingDate);
  const renewalDate = selectedCompany.renewal_at || selectedCompany.subscription_ends_at;
  const revenue = selectedCompany.total_revenue || 245320;
  const activityRows = [
    ['Plan upgraded to Enterprise', 'Admin User', '07 May 2024, 10:30 AM', 'Success', 'bi-arrow-up-circle'],
    ['New user added: John Doe', 'Admin User', '06 May 2024, 03:15 PM', 'Info', 'bi-person-plus'],
    ['Storage limit increased to 100 GB', 'Admin User', '05 May 2024, 11:20 AM', 'Success', 'bi-hdd'],
    ['Invoice generated for May 2024', 'System', '01 May 2024, 09:00 AM', 'Invoice', 'bi-receipt']
  ];

  return (
    <section className="company-details-page company-details-exact">
      {message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : null}

      <header className="module-page-header company-details-header">
        <nav className="module-breadcrumb" aria-label="breadcrumb">
          <span>Tenant Management</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
          <span>All Companies</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
          <strong>Company Details</strong>
        </nav>
      </header>

      <div className="company-profile-overview">
        <div className="company-profile-top">
          <div className="company-profile-identity">
            <span className="company-profile-avatar">{selectedInitials}</span>
            <div className="company-profile-title">
              <div className="company-title-line">
                <h1>{selectedCompany.company_name || selectedCompany.title}</h1>
                <span className={`company-status-pill is-${currentStatus}`}>{titleize(currentStatus)}</span>
              </div>
              <p>
                {companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)} Plan
                <span className="company-meta-dot" />
                Customer ID: CMP-{String(selectedCompany.id).padStart(6, '0')}
                <span className="company-meta-dot" />
                Registered on: {companyDate(selectedCompany.created_at)}
              </p>
            </div>
          </div>

          <div className="company-profile-stats">
            {[
              ['Users', usersCount, 'Total Users', 'bi-people', 'primary'],
              ['Storage', `${storageUsedGb.toFixed(2)} GB`, `${storagePercent}% Used`, 'bi-archive', 'success'],
              ['Logins', '1,248', 'Total Logins', 'bi-person-check', 'warning'],
              ['Revenue', companyCurrency(revenue), 'Total Spent', 'bi-currency-rupee', 'purple']
            ].map(([label, value, sub, icon, tone]) => (
              <span key={label} className={`is-${tone}`}>
                <i className={`bi ${icon}`} />
                <small>{label}</small>
                <strong>{value}</strong>
                <em>{sub}</em>
              </span>
            ))}
          </div>

          <div className="company-profile-actions">
            <button className="btn btn-outline-primary btn-sm" type="button"><i className="bi bi-box-arrow-in-right" /> Login as Company</button>
            <div className="company-actions">
              <button className="btn btn-primary btn-sm company-edit-btn" type="button" onClick={() => setFormRecord(selectedCompany)}>
                <i className="bi bi-pencil" /> Edit Company <i className="bi bi-chevron-down" />
              </button>
              <button className="company-row-icon" type="button" aria-label="More actions" onClick={() => setShowActions((value) => !value)}><i className="bi bi-three-dots-vertical" /></button>
              {showActions ? (
                <div className="company-action-menu">
                  <button type="button" onClick={() => { setViewRecord(selectedCompany); setShowActions(false); }}><i className="bi bi-eye" /> View</button>
                  <button type="button" onClick={() => toggleStatus(selectedCompany)}><i className={`bi ${currentStatus === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`} /> {currentStatus === 'active' ? 'Suspend' : 'Activate'}</button>
                  <button type="button" onClick={() => remove(selectedCompany)}><i className="bi bi-trash3" /> Delete</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="company-tabs">
          {['Overview', 'Subscription', `Users (${usersCount})`, 'Usage', 'Storage', 'Activity', 'Invoices (18)', 'Settings'].map((tab, index) => (
            <button className={index === 0 ? 'active' : ''} type="button" key={tab}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="company-overview-grid">
        <section className="company-info-panel">
          <div className="company-panel-head"><h2>Company Information</h2></div>
          <div className="company-info-body">
            <div className="company-info-list">
              {[
                ['Company Name', selectedCompany.company_name || selectedCompany.title],
                ['Owner Name', selectedCompany.owner_name || selectedCompany.owner],
                ['Email', selectedCompany.owner_email || selectedCompany.email],
                ['Phone', selectedCompany.phone || selectedCompany.owner_phone],
                ['Website', selectedCompany.website || '-'],
                ['Industry', selectedCompany.industry || 'Information Technology'],
                ['Country', selectedCompany.country || 'India'],
                ['State', selectedCompany.state || '-'],
                ['City', selectedCompany.city || '-'],
                ['GST Number', selectedCompany.gst_number || '-'],
                ['PAN Number', selectedCompany.pan_number || '-'],
                ['Registered On', companyDate(selectedCompany.created_at)]
              ].map(([label, value]) => <span key={label}><small>{label}</small><strong>{value || '-'}</strong></span>)}
            </div>
            <div className="company-info-art" aria-hidden="true"><i className="bi bi-buildings" /></div>
          </div>
          <button className="btn btn-outline-primary btn-sm company-panel-action" type="button" onClick={() => setViewRecord(selectedCompany)}>View More Details</button>
        </section>

        <section className="company-side-panel">
          <div className="company-panel-head">
            <h2>Subscription &amp; Plan</h2>
            <span className="company-plan-pill">{companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)}</span>
          </div>
          <div className="company-side-rows">
            <div className="company-side-row"><span>Plan</span><strong>{companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)}</strong></div>
            <div className="company-side-row"><span>Billing Cycle</span><strong>Monthly</strong></div>
            <div className="company-side-row"><span>Amount</span><strong>{companyCurrency(24999)} / month</strong></div>
            <div className="company-side-row is-billing">
              <span>Next Billing Date</span>
              <strong>
                {companyDate(billingDate)}
                {billingDays ? <em className="company-billing-note">In {billingDays} days</em> : null}
              </strong>
            </div>
            <div className="company-side-row"><span>Renewal Date</span><strong>{companyDate(renewalDate)}</strong></div>
            <div className="company-side-row"><span>Payment Method</span><strong>•••• •••• •••• 4242</strong></div>
          </div>
          <button className="btn btn-outline-primary btn-sm w-100 company-panel-btn" type="button">Manage Subscription</button>
        </section>
      </div>

      <div className="company-overview-grid">
        <section className="company-info-panel">
          <div className="company-panel-head">
            <h2>Usage Overview</h2>
            <button className="btn btn-outline-secondary btn-sm company-date-chip" type="button">01 May 2024 - 07 May 2024 <i className="bi bi-chevron-down" /></button>
          </div>
          <div className="company-usage-grid">
            {[
              ['Active Users', '18', '+12.5% vs last week', 'is-up', 'M0 30 L24 26 L48 28 L72 18 L96 22 L120 16 L144 20 L168 12 L180 8'],
              ['Logins', '342', '+8.3% vs last week', 'is-up', 'M0 26 L24 30 L48 24 L72 28 L96 20 L120 22 L144 18 L168 24 L180 14'],
              ['Transactions', '1,256', '+15.2% vs last week', 'is-up', 'M0 32 L24 28 L48 30 L72 22 L96 24 L120 18 L144 20 L168 10 L180 6'],
              ['Invoices', '58', '-4.2% vs last week', 'is-down', 'M0 12 L24 16 L48 14 L72 20 L96 18 L120 24 L144 22 L168 28 L180 32']
            ].map(([label, value, trend, tone, path]) => (
              <article className="company-usage-card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
                <em className={tone}>{trend}</em>
                <svg viewBox="0 0 180 36" preserveAspectRatio="none"><path d={path} /></svg>
              </article>
            ))}
          </div>
        </section>

        <section className="company-side-panel">
          <div className="company-panel-head">
            <h2>Storage Usage</h2>
            <span className="company-status-pill is-active">{storagePercent}% Used</span>
          </div>
          <div className="company-storage-summary">
            <div className="company-storage-donut" style={{ '--used': `${storagePercent}%` }}>
              <strong>{storagePercent}%</strong>
              <small>{storageUsedGb.toFixed(2)} GB / {storageTotalGb} GB</small>
            </div>
            <ul>
              {[['Documents', '18.45 GB (38%)'], ['Images', '12.10 GB (25%)'], ['Database', '10.25 GB (21%)'], ['Backups', '5.56 GB (11%)'], ['Others', '2.00 GB (5%)']].map(([label, value]) => (
                <li key={label}><span>{label}</span><strong>{value}</strong></li>
              ))}
            </ul>
          </div>
          <button className="btn btn-outline-primary btn-sm w-100 company-panel-btn" type="button">View Storage Details</button>
        </section>
      </div>

      <div className="company-overview-grid">
        <div className="company-main-stack">
          <section className="company-info-panel">
            <div className="company-panel-head">
              <div>
                <h2>Module Usage</h2>
                <p>Modules enabled and actively used by this company</p>
              </div>
            </div>
            <div className="company-module-list">
              {[['Accounting', 'Active', 'bi-calculator', 'success'], ['Inventory', 'Active', 'bi-box-seam', 'purple'], ['Sales', 'Active', 'bi-receipt', 'primary'], ['Purchase', 'Active', 'bi-cart3', 'warning'], ['HRM', 'Active', 'bi-people', 'danger'], ['CRM', 'Inactive', 'bi-person-lines-fill', 'info'], ['POS', 'Active', 'bi-shop', 'primary']].map(([label, statusLabel, icon, tone]) => (
                <span className={`is-${tone}${statusLabel === 'Inactive' ? ' is-inactive' : ''}`} key={label}>
                  <i className={`bi ${icon}`} />
                  <strong>{label}</strong>
                  <small>{statusLabel}</small>
                </span>
              ))}
              <button className="btn btn-outline-primary btn-sm company-module-more" type="button">View All</button>
            </div>
          </section>

          <section className="company-info-panel">
            <div className="company-panel-head">
              <h2>Recent Activity</h2>
              <button className="btn btn-outline-primary btn-sm" type="button">View All Activity</button>
            </div>
            <div className="company-activity-table-wrap">
              <table className="company-activity-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>By</th>
                    <th>Date &amp; Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activityRows.map(([activity, by, date, statusLabel, icon]) => (
                    <tr key={activity}>
                      <td><span className="company-activity-title"><i className={`bi ${icon}`} />{activity}</span></td>
                      <td>{by}</td>
                      <td>{date}</td>
                      <td><span className={`company-activity-status is-${activityTone(statusLabel)}`}>{statusLabel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="company-side-panel">
          <div className="company-panel-head"><h2>Status &amp; Health</h2></div>
          <div className="company-side-rows">
            {[
              ['Account Status', titleize(currentStatus), 'is-active'],
              ['Data Backup', 'Up to date', 'is-good'],
              ['Email Verification', 'Verified', 'is-good'],
              ['Last Login', '07 May 2024, 10:30 AM', ''],
              ['System Health', 'Good', 'is-good']
            ].map(([label, value, tone]) => (
              <div className="company-side-row" key={label}>
                <span>{label}</span>
                <strong className={tone || undefined}>{value}</strong>
              </div>
            ))}
          </div>
          <button className="btn btn-outline-primary btn-sm w-100 company-panel-btn" type="button">View System Logs</button>
        </section>
      </div>

      <CompanyFormModal record={formRecord} onClose={() => setFormRecord(null)} onSubmit={save} />
      <CompanyViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </section>
  );
}

function AllCompaniesScreen({ rows, load }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState(null);
  const [formRecord, setFormRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [message, setMessage] = useState(null);
  const companies = useMemo(() => rows.filter((row) => !row.module_key), [rows]);
  const filteredRows = useMemo(() => companies.filter((row) => {
    const haystack = JSON.stringify(row).toLowerCase();
    return (!query || haystack.includes(query.toLowerCase()))
      && (!status || companyStatus(row.status) === status)
      && (!plan || String(row.plan_id || '').toLowerCase() === plan);
  }), [companies, plan, query, status]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = filteredRows.length ? (currentPage - 1) * pageSize : 0;
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, status, plan, pageSize]);

  const save = async (values) => {
    const method = formRecord?.id ? 'PUT' : 'POST';
    const path = formRecord?.id ? `/super-admin/modules/all-companies/${formRecord.id}` : '/super-admin/modules/all-companies';
    await api(path, { method, body: JSON.stringify(values) });
    setFormRecord(null);
    setMessage({ type: 'success', text: formRecord?.id ? 'Company updated.' : 'Company added.' });
    await load();
  };

  const remove = async (row) => {
    if (!confirm(`Delete ${row.company_name || row.title}?`)) return;
    try {
      await api(`/super-admin/modules/all-companies/${row.id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Company deleted.' });
      setMenuId(null);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Company delete failed.' });
    }
  };

  const toggleStatus = async (row) => {
    const next = companyStatus(row.status) === 'active' ? 'suspended' : 'active';
    try {
      await api(`/super-admin/modules/all-companies/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, status: next }) });
      setMessage({ type: 'success', text: `Company ${next === 'active' ? 'activated' : 'suspended'}.` });
      setMenuId(null);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Status update failed.' });
    }
  };

  const statCards = [
    ['Total Companies', companies.length, '100% of total', 'bi-buildings', 'primary'],
    ['Active Companies', companyStatusCount(companies, 'active'), 'Active on platform', 'bi-check-circle', 'success'],
    ['Trial Companies', companyStatusCount(companies, 'trial'), 'Trial accounts', 'bi-hourglass-split', 'warning'],
    ['Suspended Companies', companyStatusCount(companies, 'suspended'), 'Suspended accounts', 'bi-pause-fill', 'danger'],
    ['Expired Companies', companyStatusCount(companies, 'inactive'), 'Inactive accounts', 'bi-x-octagon', 'purple'],
    ['Pending Approval', statusCount(companies, 'pending'), 'Awaiting approval', 'bi-clock', 'info']
  ];

  return (
    <section className="all-companies-page">
      {message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : null}
      <header className="module-page-header">
        <nav className="module-breadcrumb" aria-label="breadcrumb">
          <span>Tenant Management</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
          <strong>All Companies</strong>
        </nav>
        <div className="module-page-head">
          <div className="module-page-intro">
            <h1>All Companies</h1>
            <p>Manage and view all registered companies on the platform.</p>
          </div>
          <div className="all-companies-actions">
            <button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-download" /> Export</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setFormRecord({ status: 'active' })}><i className="bi bi-plus-lg" /> Add Company</button>
          </div>
        </div>
      </header>
      <div className="all-company-stats">{statCards.map(([label, value, sub, icon, tone]) => <article key={label} className={`all-company-stat is-${tone}`}><i className={`bi ${icon}`} /><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>)}</div>
      <div className="all-company-filter">
        <label><span>Search</span><div className="company-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by company name, owner, email..." /><i className="bi bi-search" /></div></label>
        <label><span>Status</span><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Status</option>{companyStatuses.map((item) => <option key={item} value={item}>{titleize(item)}</option>)}</select></label>
        <label><span>Plan</span><select className="form-select" value={plan} onChange={(event) => setPlan(event.target.value)}><option value="">All Plans</option>{companyPlans.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span>Owner</span><select className="form-select"><option>All Owners</option></select></label>
        <label><span>Date Range</span><input className="form-control" type="text" value="01 May 2024 - 07 May 2024" readOnly /></label>
        <div className="all-company-filter-actions"><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-funnel" /> Filters</button><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => { setQuery(''); setStatus(''); setPlan(''); }}><i className="bi bi-arrow-counterclockwise" /> Reset</button></div>
      </div>
      <div className="all-company-table-panel">
        <div className="all-company-table-head">
          <h2>Companies ({filteredRows.length})</h2>
          <div><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-gear" /> Columns</button><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-download" /> Export</button></div>
        </div>
        <div className="app-table-toolbar">
          <div className="app-table-length">
            <span>Show</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Entries per page">
              {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <span>entries</span>
          </div>
        </div>
        <div className="all-company-table-scroll table-responsive app-table-responsive">
          <table className="table admin-data-table all-company-table align-middle">
            <colgroup>
              <col style={{ width: '44px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '170px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '96px' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="all-company-check" />
                <th>Company</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Users</th>
                <th>Storage Used</th>
                <th>Last Login</th>
                <th className="all-company-cell-subscription">Subscription Ends</th>
                <th className="all-company-cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>{visibleRows.length ? visibleRows.map((row) => {
              const rowStatus = companyStatus(row.status);
              const initials = String(row.company_name || 'CO').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
              const storage = Number(row.storage_used_mb || 0) / 1024;
              const storagePct = Math.min(100, Math.max(4, Math.round((storage / 100) * 100)));
              const subscriptionEnds = row.subscription_ends_at || row.due_date || row.trial_ends_at;
              return (
                <tr key={row.id}>
                  <td className="all-company-check"><input type="checkbox" aria-label={`Select ${row.company_name || row.title}`} /></td>
                  <td className="all-company-cell-name"><div className="all-company-name"><span>{initials}</span><div><strong>{row.company_name || row.title}</strong><small>{row.owner_email || '-'}</small></div></div></td>
                  <td className="all-company-cell-owner"><strong>{row.owner_name || row.owner || '-'}</strong><small>{row.owner_email || '-'}</small></td>
                  <td><span className="company-plan-pill">{companyPlanLabel(row.plan_id, row.plan_name)}</span></td>
                  <td><span className={`company-status-pill is-${rowStatus}`}>{titleize(rowStatus)}</span></td>
                  <td className="all-company-cell-users"><i className="bi bi-people" /> {row.users_count || row.user_count || 25}</td>
                  <td className="all-company-cell-storage"><div className="all-company-storage"><span>{storage.toFixed(2)} GB</span><div><b style={{ width: `${storagePct}%` }} /></div><small>{storagePct}% used</small></div></td>
                  <td className="all-company-cell-date">{row.last_login_at ? companyDate(row.last_login_at) : '-'}</td>
                  <td className="all-company-cell-subscription"><span className="all-company-date-text">{companyDate(subscriptionEnds)}</span></td>
                  <td className="all-company-cell-actions">
                    <div className="all-company-row-actions">
                      <button className="company-row-icon" type="button" aria-label="Row actions" onClick={() => setMenuId(menuId === row.id ? null : row.id)}><i className="bi bi-three-dots-vertical" /></button>
                      {menuId === row.id ? (
                        <div className="company-action-menu">
                          <button type="button" onClick={() => navigate(`/super-admin/modules/company-details?company=${row.id}`)}><i className="bi bi-eye" /> View</button>
                          <button type="button" onClick={() => { setFormRecord(row); setMenuId(null); }}><i className="bi bi-pencil" /> Edit</button>
                          <button type="button" onClick={() => toggleStatus(row)}><i className={`bi ${rowStatus === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`} /> {rowStatus === 'active' ? 'Suspend' : 'Activate'}</button>
                          <button type="button" onClick={() => remove(row)}><i className="bi bi-trash3" /> Delete</button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={10} className="text-center text-muted py-4">No companies found.</td></tr>}</tbody>
          </table>
        </div>
        <div className="app-table-footer all-company-table-footer">
          <span className="all-company-table-summary">Showing {filteredRows.length ? startIndex + 1 : 0} to {startIndex + visibleRows.length} of {filteredRows.length} entries</span>
          <nav className="all-company-table-pagination" aria-label="Companies pagination">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><i className="bi bi-chevron-left" /></button>
            <button type="button" className="is-active" aria-current="page">{currentPage}</button>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Next page"><i className="bi bi-chevron-right" /></button>
          </nav>
        </div>
      </div>
      <CompanyFormModal record={formRecord} onClose={() => setFormRecord(null)} onSubmit={save} />
      <CompanyViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </section>
  );
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

  if (module === 'all-companies') {
    return <AllCompaniesScreen rows={rows} load={load} />;
  }

  if (module === 'company-details') {
    return <CompanyDetailsExactScreen rows={rows} load={load} />;
  }

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
