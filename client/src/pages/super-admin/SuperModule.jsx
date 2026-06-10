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
const companyStatuses = ['active', 'trial', 'suspended', 'inactive', 'pending'];
const companyStatusCount = (rows, status) => rows.filter((row) => companyStatus(row.status) === status).length;
const companyPlanLabel = (value, name) => name || companyPlans.find((plan) => String(plan.value) === String(value))?.label || titleize(String(value || 'Basic'));
const cleanPlanValue = (value) => String(value || '').trim().toLowerCase();
const companyPlanMatches = (row, selectedPlan) => {
  if (!selectedPlan) return true;
  const selected = companyPlans.find((item) => String(item.value) === String(selectedPlan));
  const selectedValues = [selectedPlan, selected?.label].map(cleanPlanValue).filter(Boolean);
  const rowValues = [
    row.plan_id,
    row.plan,
    row.plan_name,
    row.plan_label,
    row.subscription_plan,
    row.package_name,
    companyPlanLabel(row.plan_id || row.plan, row.plan_name || row.plan_label)
  ].map(cleanPlanValue).filter(Boolean);
  return selectedValues.some((value) => rowValues.includes(value));
};
const companyDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
const companyStorage = (value) => `${(Number(value || 0) / 1024).toFixed(2)} GB`;
const companyInitials = (value) => String(value || 'CO').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CO';
const percentOf = (value, total) => total ? `${((Number(value || 0) / total) * 100).toFixed(2)}% of total` : '0% of total';
const requestStatus = (row) => {
  const value = String(row.request_status || row.approval_status || row.application_status || row.status || 'pending').toLowerCase();
  if (['approved', 'rejected', 'pending'].includes(value)) return value;
  return 'pending';
};
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
      && companyPlanMatches(row, plan);
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

  return (
    <section className="company-details-page company-details-exact">
      {message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : null}
      <div className="company-breadcrumb">Tenant Management <i className="bi bi-chevron-right" /> All Companies <i className="bi bi-chevron-right" /> <strong>Company Details</strong></div>
      <div className="company-profile-overview">
        <div className="company-profile-head">
          <span className="company-profile-avatar">{selectedInitials}</span>
          <div className="company-profile-title">
            <div className="company-title-line"><h2>{selectedCompany.company_name || selectedCompany.title}</h2><span className={`company-status-pill is-${currentStatus}`}>{titleize(currentStatus)}</span></div>
            <p>{companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)} Plan <b>-</b> Customer ID: CMP-{String(selectedCompany.id).padStart(6, '0')} <b>-</b> Registered on: {companyDate(selectedCompany.created_at)}</p>
          </div>
          <div className="company-profile-actions">
            <button className="btn btn-outline-primary btn-sm" type="button"><i className="bi bi-box-arrow-in-right" /> Login as Company</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setFormRecord(selectedCompany)}><i className="bi bi-pencil" /> Edit Company</button>
            <div className="company-actions">
              <button className="company-row-icon" type="button" onClick={() => setShowActions((value) => !value)}><i className="bi bi-three-dots-vertical" /></button>
              {showActions ? <div className="company-action-menu"><button type="button" onClick={() => { setViewRecord(selectedCompany); setShowActions(false); }}><i className="bi bi-eye" /> View</button><button type="button" onClick={() => toggleStatus(selectedCompany)}><i className={`bi ${currentStatus === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`} /> {currentStatus === 'active' ? 'Suspend' : 'Activate'}</button><button type="button" onClick={() => remove(selectedCompany)}><i className="bi bi-trash3" /> Delete</button></div> : null}
            </div>
          </div>
        </div>
        <div className="company-profile-stats">
          {[
            ['Users', usersCount, 'Total Users', 'bi-people', 'primary'],
            ['Storage', `${storageUsedGb.toFixed(2)} GB`, `${storagePercent}% Used`, 'bi-archive', 'success'],
            ['Logins', '1,248', 'Total Logins', 'bi-person-check', 'warning'],
            ['Revenue', 'Rs. 24,320', 'Total Spent', 'bi-shield-check', 'purple']
          ].map(([label, value, sub, icon, tone]) => <span key={label} className={`is-${tone}`}><i className={`bi ${icon}`} /><small>{label}</small><strong>{value}</strong><em>{sub}</em></span>)}
        </div>
        <div className="company-tabs">
          {['Overview', 'Subscription', `Users (${usersCount})`, 'Usage', 'Storage', 'Activity', 'Invoices (18)', 'Settings'].map((tab, index) => <button className={index === 0 ? 'active' : ''} type="button" key={tab}>{tab}</button>)}
        </div>
      </div>

      <div className="company-overview-grid">
        <section className="company-info-panel">
          <div className="company-panel-head"><div><h2>Company Information</h2></div></div>
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
          <button className="btn btn-outline-primary btn-sm company-panel-action" type="button" onClick={() => setViewRecord(selectedCompany)}>View More Details</button>
        </section>
        <section className="company-side-panel">
          <div className="company-panel-head"><div><h2>Subscription & Plan</h2></div><span className="company-plan-pill">{companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)}</span></div>
          {[
            ['Plan', companyPlanLabel(selectedCompany.plan_id, selectedCompany.plan_name)],
            ['Billing Cycle', 'Monthly'],
            ['Amount', 'Rs. 24,999 / month'],
            ['Next Billing Date', companyDate(selectedCompany.subscription_ends_at)],
            ['Renewal Date', companyDate(selectedCompany.subscription_ends_at)],
            ['Payment Method', '**** **** **** 4242']
          ].map(([label, value]) => <div className="company-side-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          <button className="btn btn-outline-primary btn-sm w-100" type="button">Manage Subscription</button>
        </section>
      </div>

      <div className="company-overview-grid">
        <section className="company-info-panel">
          <div className="company-panel-head"><div><h2>Usage Overview</h2></div><button className="btn btn-outline-secondary btn-sm" type="button">01 May 2024 - 07 May 2024 <i className="bi bi-chevron-down" /></button></div>
          <div className="company-usage-grid">
            {[
              ['Active Users', '18', '12.5% vs last week', 'is-up'],
              ['Logins', '342', '8.3% vs last week', 'is-up'],
              ['Transactions', '1,256', '15.2% vs last week', 'is-up'],
              ['Invoices', '58', '4.2% vs last week', 'is-down']
            ].map(([label, value, trend, tone]) => <article className="company-usage-card" key={label}><small>{label}</small><strong>{value}</strong><em className={tone}>{trend}</em><svg viewBox="0 0 180 44" preserveAspectRatio="none"><path d="M0 28 L20 24 L38 30 L58 18 L80 22 L102 18 L124 20 L146 14 L180 8" /></svg></article>)}
          </div>
        </section>
        <section className="company-side-panel">
          <div className="company-panel-head"><div><h2>Storage Usage</h2></div><span className="company-status-pill is-active">{storagePercent}% Used</span></div>
          <div className="company-storage-summary">
            <div className="company-storage-donut" style={{ '--used': `${storagePercent}%` }}><strong>{storagePercent}%</strong><small>{storageUsedGb.toFixed(2)} GB / {storageTotalGb} GB</small></div>
            <ul>{[['Documents', '18.45 GB (38%)'], ['Images', '12.10 GB (25%)'], ['Database', '10.25 GB (21%)'], ['Backups', '5.56 GB (11%)'], ['Others', '2.00 GB (5%)']].map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul>
          </div>
          <button className="btn btn-outline-primary btn-sm w-100" type="button">View Storage Details</button>
        </section>
      </div>

      <div className="company-overview-grid">
        <div className="company-main-stack">
          <section className="company-info-panel">
            <div className="company-panel-head"><div><h2>Module Usage</h2><p>Modules enabled and actively used by this company</p></div></div>
            <div className="company-module-list">{[['Accounting', 'Active', 'bi-calculator', 'success'], ['Inventory', 'Active', 'bi-box-seam', 'purple'], ['Sales', 'Active', 'bi-receipt', 'primary'], ['Purchase', 'Active', 'bi-cart3', 'warning'], ['HRM', 'Active', 'bi-people', 'danger'], ['CRM', 'Inactive', 'bi-person-lines-fill', 'info'], ['POS', 'Active', 'bi-shop', 'primary']].map(([label, statusLabel, icon, tone]) => <span className={`is-${tone}`} key={label}><i className={`bi ${icon}`} /><strong>{label}</strong><small>{statusLabel}</small></span>)}<button className="btn btn-outline-primary btn-sm" type="button">View All</button></div>
          </section>
          <section className="company-info-panel">
            <div className="company-panel-head"><div><h2>Recent Activity</h2></div><button className="btn btn-outline-primary btn-sm" type="button">View All Activity</button></div>
            <div className="company-activity-list">{[['Plan upgraded to Enterprise', 'Admin User', '07 May 2024, 10:30 AM', 'Success'], ['New user added: John Doe', 'Admin User', '06 May 2024, 03:15 PM', 'Info'], ['Storage limit increased to 100 GB', 'Admin User', '05 May 2024, 11:20 AM', 'Success'], ['Invoice generated for May 2024', 'System', '01 May 2024, 09:00 AM', 'Invoice']].map(([activity, by, date, statusLabel]) => <span key={activity}><strong>{activity}</strong><small>{by}</small><small>{date}</small><em>{statusLabel}</em></span>)}</div>
          </section>
        </div>
        <section className="company-side-panel">
          <div className="company-panel-head"><div><h2>Status & Health</h2></div></div>
          {[
            ['Account Status', titleize(currentStatus)],
            ['Data Backup', 'Up to date'],
            ['Email Verification', 'Verified'],
            ['Last Login', '07 May 2024, 10:30 AM'],
            ['System Health', 'Good']
          ].map(([label, value]) => <div className="company-side-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
          <button className="btn btn-outline-primary btn-sm w-100" type="button">View System Logs</button>
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
  const [viewMode, setViewMode] = useState('table');
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
      && companyPlanMatches(row, plan);
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
        <label><span>Date Range</span><input className="form-control" type="text" value="01 May 2024 - 07 May 2024" readOnly /></label>
        <div className="all-company-filter-actions"><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-funnel" /> Filters</button><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => { setQuery(''); setStatus(''); setPlan(''); }}><i className="bi bi-arrow-counterclockwise" /> Reset</button></div>
      </div>
      <div className="all-company-table-panel">
        <div className="all-company-table-head">
          <h2>Companies ({filteredRows.length})</h2>
          <div className="company-view-toggle" role="group" aria-label="View mode">
            <button className={viewMode === 'table' ? 'is-active' : ''} type="button" onClick={() => setViewMode('table')}><i className="bi bi-table" /> Table View</button>
            <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => setViewMode('grid')}><i className="bi bi-grid" /> Grid View</button>
          </div>
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
          {viewMode === 'table' ? (
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
                const initials = companyInitials(row.company_name || row.title);
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
          ) : (
            <div className="company-status-grid all-company-grid">
              {visibleRows.length ? visibleRows.map((row) => {
                const rowStatus = companyStatus(row.status);
                const storage = Number(row.storage_used_mb || 0) / 1024;
                const subscriptionEnds = row.subscription_ends_at || row.due_date || row.trial_ends_at;
                return (
                  <article key={row.id} className="company-status-card all-company-grid-card">
                    <div className="all-company-name"><span>{companyInitials(row.company_name || row.title)}</span><div><strong>{row.company_name || row.title}</strong><small>{row.owner_email || '-'}</small></div></div>
                    <div className="all-company-grid-meta">
                      <span><small>Owner</small><strong>{row.owner_name || row.owner || '-'}</strong></span>
                      <span><small>Users</small><strong>{row.users_count || row.user_count || 25}</strong></span>
                      <span><small>Storage</small><strong>{storage.toFixed(2)} GB</strong></span>
                      <span><small>Ends</small><strong>{companyDate(subscriptionEnds)}</strong></span>
                    </div>
                    <div className="all-company-grid-tags"><span className="company-plan-pill">{companyPlanLabel(row.plan_id, row.plan_name)}</span><span className={`company-status-pill is-${rowStatus}`}>{titleize(rowStatus)}</span></div>
                    <div className="all-company-grid-actions">
                      <button className="company-row-icon" type="button" aria-label="View company" onClick={() => navigate(`/super-admin/modules/company-details?company=${row.id}`)}><i className="bi bi-eye" /></button>
                      <button className="company-row-icon" type="button" aria-label="Edit company" onClick={() => setFormRecord(row)}><i className="bi bi-pencil" /></button>
                      <button className="company-row-icon" type="button" aria-label={rowStatus === 'active' ? 'Suspend company' : 'Activate company'} onClick={() => toggleStatus(row)}><i className={`bi ${rowStatus === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`} /></button>
                      <button className="company-row-icon" type="button" aria-label="Delete company" onClick={() => remove(row)}><i className="bi bi-trash3" /></button>
                    </div>
                  </article>
                );
              }) : <p className="text-center text-muted mb-0 py-4">No companies found.</p>}
            </div>
          )}
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

function CompanyStatusScreen({ rows, load }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [viewMode, setViewMode] = useState('table');
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
      && companyPlanMatches(row, plan);
  }), [companies, plan, query, status]);
  const total = companies.length;
  const active = companyStatusCount(companies, 'active');
  const trial = companyStatusCount(companies, 'trial');
  const suspended = companyStatusCount(companies, 'suspended');
  const expired = companyStatusCount(companies, 'inactive');
  const pending = companyStatusCount(companies, 'pending');
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = filteredRows.length ? (currentPage - 1) * pageSize : 0;
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, status, plan, pageSize]);

  const save = async (values) => {
    const method = formRecord?.id ? 'PUT' : 'POST';
    const path = formRecord?.id ? `/super-admin/modules/company-status/${formRecord.id}` : '/super-admin/modules/company-status';
    await api(path, { method, body: JSON.stringify(values) });
    setFormRecord(null);
    setMessage({ type: 'success', text: formRecord?.id ? 'Company updated.' : 'Company added.' });
    await load();
  };

  const toggleStatus = async (row) => {
    const next = companyStatus(row.status) === 'active' ? 'suspended' : 'active';
    try {
      await api(`/super-admin/modules/company-status/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, status: next }) });
      setMessage({ type: 'success', text: `Company ${next === 'active' ? 'activated' : 'suspended'}.` });
      setMenuId(null);
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Status update failed.' });
    }
  };

  const exportRows = () => {
    const lines = [
      ['Company', 'Plan', 'Status', 'Users', 'Storage Used', 'Last Login'],
      ...filteredRows.map((row) => [
        row.company_name || row.title || '',
        companyPlanLabel(row.plan_id, row.plan_name),
        titleize(companyStatus(row.status)),
        row.users_count || row.user_count || 25,
        companyStorage(row.storage_used_mb),
        row.last_login_at ? companyDate(row.last_login_at) : '-'
      ])
    ];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'company-status.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    ['Total Companies', total, 'All registered companies', 'bi-buildings', 'primary'],
    ['Active Companies', active, percentOf(active, total), 'bi-check-circle', 'success'],
    ['Trial Companies', trial, percentOf(trial, total), 'bi-hourglass-split', 'warning'],
    ['Suspended Companies', suspended, percentOf(suspended, total), 'bi-pause-fill', 'danger'],
    ['Expired Companies', expired, percentOf(expired, total), 'bi-x-octagon', 'purple'],
    ['Pending Approval', pending, percentOf(pending, total), 'bi-clock', 'info']
  ];
  const quickLinks = [
    ['Company Requests', 'Review and manage new company requests', pending || 8, 'bi-file-earmark-text', 'primary', 'company-requests'],
    ['Suspended Companies', 'View and reactivate suspended companies', suspended || 0, 'bi-slash-circle', 'danger', 'suspended-companies'],
    ['Company Usage', 'Analyze company usage and analytics', null, 'bi-pie-chart', 'success', 'company-usage'],
    ['Company Storage', 'Monitor storage usage and manage space', null, 'bi-database', 'purple', 'company-storage']
  ];

  return (
    <section className="company-status-page all-companies-page">
      {message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : null}
      <header className="module-page-header">
        <nav className="module-breadcrumb" aria-label="breadcrumb">
          <span>Tenant Management</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
          <strong>Company Status</strong>
        </nav>
        <div className="module-page-head">
          <div className="module-page-intro">
            <h1>Company Status</h1>
            <p>Overview of all companies and their current status.</p>
          </div>
          <div className="all-companies-actions">
            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={exportRows}><i className="bi bi-upload" /> Export</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setFormRecord({ status: 'active' })}><i className="bi bi-plus-lg" /> Add Company</button>
          </div>
        </div>
      </header>

      <div className="all-company-stats">{statCards.map(([label, value, sub, icon, tone]) => <article key={label} className={`all-company-stat is-${tone}`}><i className={`bi ${icon}`} /><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>)}</div>

      <div className="all-company-filter company-status-filter">
        <label><span>Search</span><div className="company-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company name, owner, email..." /><i className="bi bi-search" /></div></label>
        <label><span>Status</span><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Status</option>{companyStatuses.map((item) => <option key={item} value={item}>{item === 'inactive' ? 'Expired' : titleize(item)}</option>)}</select></label>
        <label><span>Plan</span><select className="form-select" value={plan} onChange={(event) => setPlan(event.target.value)}><option value="">All Plans</option>{companyPlans.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span>Date Range</span><div className="company-date-control"><i className="bi bi-calendar3" /><input className="form-control" type="text" value="01 May 2024 - 07 May 2024" readOnly /></div></label>
        <div className="all-company-filter-actions"><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-funnel" /> More Filters</button><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => { setQuery(''); setStatus(''); setPlan(''); }}><i className="bi bi-arrow-counterclockwise" /> Reset</button></div>
      </div>

      <div className="all-company-table-panel">
        <div className="all-company-table-head">
          <h2>Companies ({filteredRows.length})</h2>
          <div className="company-view-toggle" role="group" aria-label="View mode">
            <button className={viewMode === 'table' ? 'is-active' : ''} type="button" onClick={() => setViewMode('table')}><i className="bi bi-table" /> Table View</button>
            <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => setViewMode('grid')}><i className="bi bi-grid" /> Grid View</button>
          </div>
        </div>
        <div className="all-company-table-scroll table-responsive app-table-responsive">
          {viewMode === 'table' ? (
            <table className="table admin-data-table all-company-table company-status-table align-middle">
              <colgroup>
                <col style={{ width: '44px' }} />
                <col style={{ width: '250px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '210px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '116px' }} />
              </colgroup>
              <thead><tr><th className="all-company-check" /><th>Company</th><th>Plan</th><th>Status</th><th>Users</th><th>Storage Used</th><th>Last Login</th><th className="all-company-cell-actions">Actions</th></tr></thead>
              <tbody>{visibleRows.length ? visibleRows.map((row) => {
                const rowStatus = companyStatus(row.status);
                const storage = Number(row.storage_used_mb || 0) / 1024;
                const storagePct = Math.min(100, Math.max(4, Math.round((storage / 100) * 100)));
                return (
                  <tr key={row.id}>
                    <td className="all-company-check"><input type="checkbox" aria-label={`Select ${row.company_name || row.title}`} /></td>
                    <td className="all-company-cell-name"><div className="all-company-name"><span>{companyInitials(row.company_name || row.title)}</span><div><strong>{row.company_name || row.title}</strong><small>{row.owner_email || '-'}</small></div></div></td>
                    <td><span className="company-plan-pill">{companyPlanLabel(row.plan_id, row.plan_name)}</span></td>
                    <td><span className={`company-status-pill is-${rowStatus}`}>{rowStatus === 'inactive' ? 'Expired' : titleize(rowStatus)}</span></td>
                    <td className="all-company-cell-users"><i className="bi bi-people" /> {row.users_count || row.user_count || 25}</td>
                    <td className="all-company-cell-storage"><div className="all-company-storage"><span>{storage.toFixed(2)} GB</span><div><b style={{ width: `${storagePct}%` }} /></div><small>{storagePct}%</small></div></td>
                    <td className="all-company-cell-date">{row.last_login_at ? companyDate(row.last_login_at) : '-'}</td>
                    <td className="all-company-cell-actions">
                      <div className="all-company-row-actions">
                        <button className="company-row-icon" type="button" aria-label="View company" onClick={() => navigate(`/super-admin/modules/company-details?company=${row.id}`)}><i className="bi bi-eye" /></button>
                        <button className="company-row-icon" type="button" aria-label={rowStatus === 'active' ? 'Suspend company' : 'Activate company'} onClick={() => toggleStatus(row)}><i className={`bi ${rowStatus === 'active' ? 'bi-box-arrow-in-right' : 'bi-check2-circle'}`} /></button>
                        <button className="company-row-icon" type="button" aria-label="More actions" onClick={() => setMenuId(menuId === row.id ? null : row.id)}><i className="bi bi-three-dots-vertical" /></button>
                        {menuId === row.id ? <div className="company-action-menu"><button type="button" onClick={() => { setViewRecord(row); setMenuId(null); }}><i className="bi bi-eye" /> View</button><button type="button" onClick={() => { setFormRecord(row); setMenuId(null); }}><i className="bi bi-pencil" /> Edit</button><button type="button" onClick={() => toggleStatus(row)}><i className={`bi ${rowStatus === 'active' ? 'bi-toggle-on' : 'bi-toggle-off'}`} /> {rowStatus === 'active' ? 'Suspend' : 'Activate'}</button></div> : null}
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={8} className="text-center text-muted py-4">No companies found.</td></tr>}</tbody>
            </table>
          ) : (
            <div className="company-status-grid">
              {visibleRows.map((row) => {
                const rowStatus = companyStatus(row.status);
                return <article key={row.id} className="company-status-card"><div className="all-company-name"><span>{companyInitials(row.company_name || row.title)}</span><div><strong>{row.company_name || row.title}</strong><small>{row.owner_email || '-'}</small></div></div><span className={`company-status-pill is-${rowStatus}`}>{rowStatus === 'inactive' ? 'Expired' : titleize(rowStatus)}</span><small>{companyPlanLabel(row.plan_id, row.plan_name)} Plan</small><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => navigate(`/super-admin/modules/company-details?company=${row.id}`)}>Open Details</button></article>;
              })}
              {!visibleRows.length ? <p className="text-center text-muted mb-0 py-4">No companies found.</p> : null}
            </div>
          )}
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

      <div className="company-status-quicklinks">
        {quickLinks.map(([label, text, count, icon, tone, moduleName]) => <button className={`company-status-quicklink is-${tone}`} type="button" key={label} onClick={() => navigate(`/super-admin/modules/${moduleName}`)}><i className={`bi ${icon}`} /><span><strong>{label}</strong><small>{text}</small></span>{count !== null ? <em>{count}</em> : <i className="bi bi-chevron-right" />}</button>)}
      </div>

      <CompanyFormModal record={formRecord} onClose={() => setFormRecord(null)} onSubmit={save} />
      <CompanyViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </section>
  );
}

function CompanyRequestsScreen({ rows, load }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [detailTab, setDetailTab] = useState('details');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState(null);
  const companies = useMemo(() => rows.filter((row) => !row.module_key), [rows]);
  const demoRequests = useMemo(() => ([
    { id: 'demo-1', company_name: 'Bright Future Solutions', owner_name: 'Neha Singh', owner_email: 'neha@bfsl.com', phone: '+91 98765 43210', website: 'www.bfsl.com', industry: 'Trading & Distribution', country: 'India', state: 'Maharashtra', city: 'Pune', gst_number: '27AABCC1234D1Z5', pan_number: 'AABCC1234D', plan_id: '2', plan_name: 'Professional', billing_cycle: 'Monthly', amount: 'Rs. 14,999 / month', requested_at: '2024-05-07T10:30:00', status: 'pending', note: 'We are interested in using your ERP platform for our growing business. Please approve our request. Thank you!' },
    { id: 'demo-2', company_name: 'Acme Corporation Pvt. Ltd.', owner_name: 'Admin User', owner_email: 'admin@acme.com', phone: '+91 98765 12345', plan_id: '3', plan_name: 'Enterprise', requested_at: '2024-05-07T09:15:00', status: 'pending' },
    { id: 'demo-3', company_name: 'Rural Supply Co.', owner_name: 'Anil Patel', owner_email: 'anil@rural.com', phone: '+91 91234 56789', plan_id: '1', plan_name: 'Basic', requested_at: '2024-05-06T16:20:00', status: 'pending' },
    { id: 'demo-4', company_name: 'Global Tech Systems', owner_name: 'Ravi Sharma', owner_email: 'ravi@gts.com', phone: '+91 99887 66554', plan_id: '3', plan_name: 'Enterprise', requested_at: '2024-05-06T11:45:00', status: 'pending' },
    { id: 'demo-5', company_name: 'Alpha Enterprises', owner_name: 'Pooja Verma', owner_email: 'pooja@alpha.com', phone: '+91 89990 11223', plan_id: '2', plan_name: 'Professional', requested_at: '2024-05-05T15:30:00', status: 'pending' },
    { id: 'demo-6', company_name: 'WebBrain Technologies', owner_name: 'Meera Nair', owner_email: 'meera@webbrain.com', phone: '+91 79001 22334', plan_id: '2', plan_name: 'Professional', requested_at: '2024-05-05T13:10:00', status: 'pending' },
    { id: 'demo-7', company_name: 'Foodie On Demand', owner_name: 'Simran Kaur', owner_email: 'simran@foodie.com', phone: '+91 77889 44556', plan_id: '1', plan_name: 'Basic', requested_at: '2024-05-04T10:05:00', status: 'pending' },
    { id: 'demo-8', company_name: 'Smart Digital Hub', owner_name: 'Karan Gupta', owner_email: 'karan@sdhub.com', phone: '+91 76677 88990', plan_id: '1', plan_name: 'Basic', requested_at: '2024-05-04T09:00:00', status: 'pending' }
  ]), []);
  const sourceRows = companies.length ? companies : demoRequests;
  const requests = useMemo(() => sourceRows.map((row, index) => ({
    ...row,
    requestStatus: requestStatus(row),
    requested_at: row.requested_at || row.created_at || row.updated_at || demoRequests[index % demoRequests.length]?.requested_at,
    note: row.note || row.description || demoRequests[index % demoRequests.length]?.note || 'We are interested in using your ERP platform. Please review our company registration request.'
  })), [demoRequests, sourceRows]);
  const counts = {
    pending: requests.filter((row) => row.requestStatus === 'pending').length,
    approved: requests.filter((row) => row.requestStatus === 'approved').length,
    rejected: requests.filter((row) => row.requestStatus === 'rejected').length
  };
  const tabRows = requests.filter((row) => row.requestStatus === activeTab);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(tabRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = tabRows.length ? (currentPage - 1) * pageSize : 0;
  const visibleRows = tabRows.slice(startIndex, startIndex + pageSize);
  const selectedRequest = requests.find((row) => String(row.id) === String(selectedId)) || tabRows[0] || requests[0] || {};

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedId && selectedRequest?.id) setSelectedId(selectedRequest.id);
  }, [selectedId, selectedRequest]);

  const updateRequest = async (row, nextStatus) => {
    if (!row?.id || String(row.id).startsWith('demo-')) {
      setMessage({ type: nextStatus === 'approved' ? 'success' : 'danger', text: `Request ${nextStatus}.` });
      return;
    }
    try {
      await api(`/super-admin/modules/company-requests/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, status: nextStatus, request_status: nextStatus }) });
      setMessage({ type: nextStatus === 'approved' ? 'success' : 'danger', text: `Request ${nextStatus}.` });
      await load();
    } catch (error) {
      setMessage({ type: 'danger', text: error.message || 'Request update failed.' });
    }
  };

  const requestDate = (value) => value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const statCards = [
    ['Pending Requests', counts.pending || 14, 'Awaiting approval', 'bi-bag', 'purple'],
    ['Approved Today', counts.approved || 5, 'New companies', 'bi-check-circle-fill', 'success'],
    ['Rejected Today', counts.rejected || 1, 'Rejected requests', 'bi-x-circle-fill', 'danger'],
    ['Total Requests', requests.length || 152, 'All time', 'bi-clock', 'primary']
  ];
  const tabs = [
    ['pending', `Pending (${counts.pending || 14})`],
    ['approved', `Approved (${counts.approved || 32})`],
    ['rejected', `Rejected (${counts.rejected || 7})`]
  ];
  const detailTabs = [
    ['details', 'Details'],
    ['documents', 'Documents (4)'],
    ['notes', 'Notes (2)'],
    ['activity', 'Activity']
  ];

  return (
    <section className="company-requests-page">
      {message ? <div className={`alert alert-${message.type}`}>{message.text}</div> : null}
      <header className="module-page-header">
        <nav className="module-breadcrumb" aria-label="breadcrumb"><span>Tenant Management</span><i className="bi bi-chevron-right" /><strong>Company Requests</strong></nav>
        <div className="module-page-head">
          <div className="module-page-intro"><h1>Company Requests</h1><p>Review and manage new company registration requests.</p></div>
          <button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-funnel" /> Filter</button>
        </div>
      </header>
      <div className="company-requests-layout">
        <main className="company-requests-main">
          <div className="request-stats">{statCards.map(([label, value, sub, icon, tone]) => <article className={`request-stat is-${tone}`} key={label}><i className={`bi ${icon}`} /><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>)}</div>
          <section className="request-detail-panel">
            <div className="request-detail-head"><div><h2>{selectedRequest.company_name || selectedRequest.title || 'Company Request'}</h2></div><span className={`request-status-pill is-${selectedRequest.requestStatus || 'pending'}`}>{titleize(selectedRequest.requestStatus || 'pending')}</span><button className="company-row-icon" type="button" aria-label="Close details"><i className="bi bi-x-lg" /></button></div>
            <div className="request-detail-tabs" role="tablist">{detailTabs.map(([key, label]) => <button className={detailTab === key ? 'is-active' : ''} type="button" key={key} onClick={() => setDetailTab(key)}>{label}</button>)}</div>
            <div className="request-detail-content">
              {detailTab === 'details' ? (
                <>
                  <section className="request-detail-section"><h3>Company Information</h3>{[['Company Name', selectedRequest.company_name || selectedRequest.title], ['Owner Name', selectedRequest.owner_name || selectedRequest.owner], ['Email', selectedRequest.owner_email || selectedRequest.email], ['Phone', selectedRequest.phone || selectedRequest.owner_phone], ['Website', selectedRequest.website || 'www.bfsl.com'], ['Industry', selectedRequest.industry || 'Trading & Distribution'], ['Country', selectedRequest.country || 'India'], ['State', selectedRequest.state || 'Maharashtra'], ['City', selectedRequest.city || 'Pune'], ['GST Number', selectedRequest.gst_number || '27AABCC1234D1Z5'], ['PAN Number', selectedRequest.pan_number || 'AABCC1234D']].map(([label, value]) => <div className="request-detail-row" key={label}><span>{label}</span><strong>{value || '-'}</strong></div>)}</section>
                  <section className="request-detail-section"><h3>Requested Plan</h3>{[['Plan', `${companyPlanLabel(selectedRequest.plan_id, selectedRequest.plan_name)} Plan`], ['Billing Cycle', selectedRequest.billing_cycle || 'Monthly'], ['Amount', selectedRequest.amount || (String(selectedRequest.plan_id) === '1' ? 'Rs. 4,999 / month' : String(selectedRequest.plan_id) === '3' ? 'Rs. 29,999 / month' : 'Rs. 14,999 / month')]].map(([label, value]) => <div className="request-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}<div className="request-note"><span>Note from Applicant</span><p>{selectedRequest.note}</p></div></section>
                </>
              ) : null}
              {detailTab === 'documents' ? <section className="request-detail-section request-detail-wide"><h3>Documents</h3>{['GST Certificate', 'PAN Card', 'Address Proof', 'Owner ID Proof'].map((item) => <div className="request-document-row" key={item}><i className="bi bi-file-earmark-text" /><strong>{item}</strong><button className="btn btn-outline-secondary btn-sm" type="button"><i className="bi bi-eye" /> View</button></div>)}</section> : null}
              {detailTab === 'notes' ? <section className="request-detail-section request-detail-wide"><h3>Notes</h3><div className="request-note"><span>Note from Applicant</span><p>{selectedRequest.note}</p></div><div className="request-note"><span>Internal Note</span><p>Review business details, verify documents, then approve or reject this registration request.</p></div></section> : null}
              {detailTab === 'activity' ? <section className="request-detail-section request-detail-wide"><h3>Activity</h3>{[['Request submitted', requestDate(selectedRequest.requested_at)], ['Documents uploaded', 'Pending review'], ['Status', titleize(selectedRequest.requestStatus || 'pending')]].map(([label, value]) => <div className="request-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section> : null}
            </div>
            <div className="request-detail-actions"><button className="btn btn-outline-danger" type="button" onClick={() => updateRequest(selectedRequest, 'rejected')}><i className="bi bi-x-lg" /> Reject</button><button className="btn btn-success" type="button" onClick={() => updateRequest(selectedRequest, 'approved')}><i className="bi bi-check-circle" /> Approve</button></div>
          </section>
          <div className="request-tabs" role="tablist">{tabs.map(([key, label]) => <button key={key} className={activeTab === key ? 'is-active' : ''} type="button" onClick={() => setActiveTab(key)}>{label}</button>)}</div>
          <section className="request-table-panel">
            <div className="all-company-table-scroll table-responsive app-table-responsive">
              <table className="table admin-data-table request-table align-middle">
                <thead><tr><th className="all-company-check"><input type="checkbox" aria-label="Select all requests" /></th><th>Company / Owner</th><th>Plan</th><th>Requested On</th><th>Contact</th><th>Status</th><th className="request-actions-cell">Actions</th></tr></thead>
                <tbody>{visibleRows.length ? visibleRows.map((row) => {
                  const statusName = row.requestStatus;
                  return (
                    <tr key={row.id} className={String(selectedRequest.id) === String(row.id) ? 'is-selected' : ''}>
                      <td className="all-company-check"><input type="checkbox" aria-label={`Select ${row.company_name || row.title}`} /></td>
                      <td><button className="request-company-cell" type="button" onClick={() => setSelectedId(row.id)}><span>{companyInitials(row.company_name || row.title)}</span><strong>{row.company_name || row.title}<small>{row.owner_name || row.owner || '-'}</small></strong></button></td>
                      <td><span className="company-plan-pill">{companyPlanLabel(row.plan_id, row.plan_name)}</span></td>
                      <td className="request-date-cell">{requestDate(row.requested_at)}</td>
                      <td>{row.owner_email || row.email || '-'}<small className="d-block text-muted">{row.phone || row.owner_phone || '-'}</small></td>
                      <td><span className={`request-status-pill is-${statusName}`}>{titleize(statusName)}</span></td>
                      <td className="request-actions-cell"><div className="request-row-actions"><button className="company-row-icon" type="button" aria-label="View request" onClick={() => setSelectedId(row.id)}><i className="bi bi-eye" /></button><button className="request-action-btn is-approve" type="button" aria-label="Approve request" onClick={() => updateRequest(row, 'approved')}><i className="bi bi-check-lg" /></button><button className="request-action-btn is-reject" type="button" aria-label="Reject request" onClick={() => updateRequest(row, 'rejected')}><i className="bi bi-x-lg" /></button></div></td>
                    </tr>
                  );
                }) : <tr><td colSpan={7} className="text-center text-muted py-4">No {activeTab} requests found.</td></tr>}</tbody>
              </table>
            </div>
            <div className="app-table-footer all-company-table-footer"><span className="all-company-table-summary">Showing {tabRows.length ? startIndex + 1 : 0} to {startIndex + visibleRows.length} of {tabRows.length || counts.pending || 14} entries</span><nav className="all-company-table-pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><i className="bi bi-chevron-left" /></button><button type="button" className="is-active">{currentPage}</button><button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><i className="bi bi-chevron-right" /></button></nav></div>
          </section>
        </main>
      </div>
    </section>
  );
}

function TenantOverviewScreen({ rows }) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('01 May 2024 - 07 May 2024');
  const [trendPeriod, setTrendPeriod] = useState('Monthly');
  const [showActivities, setShowActivities] = useState(false);
  const companies = useMemo(() => rows.filter((row) => !row.module_key), [rows]);
  const total = companies.length || 152;
  const active = companyStatusCount(companies, 'active') || 98;
  const trial = companyStatusCount(companies, 'trial') || 18;
  const suspended = companyStatusCount(companies, 'suspended') || 12;
  const expired = companyStatusCount(companies, 'inactive') || 10;
  const pending = statusCount(companies, 'pending') || 14;
  const storageGb = companies.reduce((sum, row) => sum + Number(row.storage_used_mb || 0), 0) / 1024 || 256.48;

  const overviewCards = [
    ['Total Companies', total, '12.5% from last month', 'bi-buildings', 'primary', 'up'],
    ['Active Companies', active, '8.3% from last month', 'bi-check-circle', 'success', 'up'],
    ['Trial Companies', trial, '2.1% from last month', 'bi-hourglass-split', 'warning', 'down'],
    ['Suspended Companies', suspended, '5.6% from last month', 'bi-pause-fill', 'danger', 'down'],
    ['Total Revenue', 'Rs. 12,45,320', '18.6% from last month', 'bi-x-octagon', 'purple', 'up'],
    ['Total Users', '1,248', '15.6% from last month', 'bi-people', 'primary', 'up']
  ];
  const statuses = [
    ['Active', active, '64.47%', '#12b76a'],
    ['Trial', trial, '11.84%', '#f79009'],
    ['Suspended', suspended, '7.89%', '#f04438'],
    ['Expired', expired, '6.58%', '#9e77ed'],
    ['Pending Approval', pending, '9.21%', '#315dff']
  ];
  const plans = [
    ['Enterprise', 52, '34.21%', '#9e77ed'],
    ['Professional', 45, '29.61%', '#5297ff'],
    ['Basic', 32, '21.05%', '#12b76a'],
    ['Standard', 15, '9.86%', '#f79009'],
    ['Custom', 8, '5.26%', '#9e77ed']
  ];
  const trendViews = {
    Weekly: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], path: 'M0 142 C42 102 82 126 120 92 S200 54 246 84 310 132 360 86 430 44 520 72' },
    Monthly: { labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], path: 'M0 150 C45 90 75 95 105 118 S165 165 210 112 265 35 322 82 395 120 450 62 490 20 520 48' },
    Quarterly: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], path: 'M0 154 C72 118 122 132 178 92 S286 34 352 82 436 150 520 64' }
  };
  const activeTrend = trendViews[trendPeriod] || trendViews.Monthly;
  const activities = [
    ['Bright Future Solutions', 'New company registered', '2 mins ago', 'bi-buildings', 'success', 'all-companies'],
    ['Acme Corporation Pvt. Ltd.', 'Plan upgraded to Enterprise', '10 mins ago', 'bi-arrow-up', 'purple', 'plans'],
    ['Global Tech Systems', 'Company suspended', '30 mins ago', 'bi-slash-circle', 'danger', 'suspended-companies'],
    ['NextGen Innovations', 'Storage limit increased', '1 hour ago', 'bi-cloud-arrow-up', 'primary', 'company-storage'],
    ['Alpha Enterprises', 'New user added', '2 hours ago', 'bi-person', 'warning', 'all-users']
  ];
  const goModule = (moduleName) => navigate(`/super-admin/modules/${moduleName}`);
  const downloadReport = () => {
    const lines = [
      ['Tenant Overview Report'],
      ['Date Range', dateRange],
      ['Trend View', trendPeriod],
      [],
      ['Metric', 'Value', 'Change'],
      ...overviewCards.map(([label, value, sub]) => [label, value, sub]),
      [],
      ['Status', 'Companies', 'Percent'],
      ...statuses.map(([label, value, percent]) => [label, value, percent]),
      [],
      ['Plan', 'Companies', 'Percent'],
      ...plans.map(([label, value, percent]) => [label, value, percent])
    ];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tenant-overview-${dateRange.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="tenant-overview-page">
      <div className="tenant-overview-top">
        <div>
          <div className="company-breadcrumb">Tenant Management <i className="bi bi-chevron-right" /> <strong>Overview</strong></div>
          <h1>Overview</h1>
          <p>Complete overview of all tenant companies and platform usage.</p>
        </div>
        <div className="tenant-overview-actions">
          <label className="tenant-inline-select"><i className="bi bi-calendar3" /><select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Report date range"><option>01 May 2024 - 07 May 2024</option><option>08 May 2024 - 14 May 2024</option><option>May 2024</option><option>Last 30 Days</option></select></label>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={downloadReport}><i className="bi bi-download" /> Download Report</button>
        </div>
      </div>
      <div className="tenant-overview-stats">
        {overviewCards.map(([label, value, sub, icon, tone, trend]) => <article className={`tenant-overview-stat is-${tone}`} key={label}><i className={`bi ${icon}`} /><span>{label}</span><strong>{value}</strong><small className={`is-${trend}`}>{trend === 'up' ? '↑' : '↓'} {sub}</small></article>)}
      </div>
      <div className="tenant-overview-grid">
        <section className="tenant-overview-panel">
          <h2>Company Status Distribution</h2>
          <div className="tenant-status-content"><div className="tenant-status-donut"><strong>{total}</strong><small>Total</small></div><ul>{statuses.map(([label, value, percent, color]) => <li key={label}><span style={{ '--dot': color }}>{label}</span><strong>{value} ({percent})</strong></li>)}</ul></div>
          <button type="button" className="tenant-panel-link" onClick={() => goModule('company-status')}>View Company Status <i className="bi bi-arrow-right" /></button>
        </section>
        <section className="tenant-overview-panel">
          <div className="tenant-panel-head"><h2>New Companies Trend</h2><select className="form-select form-select-sm tenant-period-select" value={trendPeriod} onChange={(event) => setTrendPeriod(event.target.value)} aria-label="Company trend period"><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select></div>
          <div className="tenant-line-chart"><svg viewBox="0 0 520 210" preserveAspectRatio="none"><g>{[40,80,120,160].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} />)}</g><path d={activeTrend.path} /></svg><div>{activeTrend.labels.map((label) => <span key={label}>{label}</span>)}</div></div>
          <button type="button" className="tenant-panel-link" onClick={() => goModule('all-companies')}>View All Companies <i className="bi bi-arrow-right" /></button>
        </section>
        <section className="tenant-overview-panel">
          <h2>Top Plans by Companies</h2>
          <div className="tenant-plan-list">{plans.map(([label, value, percent, color]) => <span key={label}><small>{label}</small><b><em style={{ width: `${value}%`, background: color }} /></b><strong>{value} ({percent})</strong></span>)}</div>
          <button type="button" className="tenant-panel-link" onClick={() => goModule('plans')}>View Plans <i className="bi bi-arrow-right" /></button>
        </section>
        <section className="tenant-overview-panel">
          <div className="tenant-panel-head"><h2>Company Requests</h2><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => goModule('company-requests')}>View All</button></div>
          {[['Pending Requests', 8, 'bi-file-earmark-text', 'warning'], ['Approved Requests', 32, 'bi-check2-square', 'success'], ['Rejected Requests', 5, 'bi-slash-circle', 'danger']].map(([label, value, icon, tone]) => <div className="tenant-mini-row" key={label}><span className={`is-${tone}`}><i className={`bi ${icon}`} /> {label}</span><strong>{value}</strong></div>)}
          <button type="button" className="tenant-panel-link" onClick={() => goModule('company-requests')}>Manage Requests <i className="bi bi-arrow-right" /></button>
        </section>
        <section className="tenant-overview-panel">
          <div className="tenant-panel-head"><h2>Suspended Companies</h2><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => goModule('suspended-companies')}>View All</button></div>
          {[['Total Suspended', suspended, 'bi-slash-circle', 'danger'], ['Suspended This Month', 3, 'bi-clock-history', 'purple'], ['Reactivated This Month', 2, 'bi-check-circle', 'success']].map(([label, value, icon, tone]) => <div className="tenant-mini-row" key={label}><span className={`is-${tone}`}><i className={`bi ${icon}`} /> {label}</span><strong>{value}</strong></div>)}
          <button type="button" className="tenant-panel-link" onClick={() => goModule('suspended-companies')}>Manage Suspended Companies <i className="bi bi-arrow-right" /></button>
        </section>
        <section className="tenant-overview-panel">
          <div className="tenant-panel-head"><h2>Platform Usage Summary</h2><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => goModule('analytics-companies')}>View Analytics</button></div>
          {[['Total Storage Used', `${storageGb.toFixed(2)} GB`, 'bi-calendar2'], ['Avg. Storage per Company', '1.69 GB', 'bi-hdd'], ['Total Users', '1,248', 'bi-person'], ['Active Users', '856', 'bi-people'], ['Total Logins (This Month)', '4,562', 'bi-clock-history']].map(([label, value, icon]) => <div className="tenant-usage-row" key={label}><span><i className={`bi ${icon}`} /> {label}</span><strong>{value}</strong></div>)}
          <button type="button" className="tenant-panel-link" onClick={() => goModule('analytics-companies')}>View Detailed Analytics <i className="bi bi-arrow-right" /></button>
        </section>
      </div>
      <section className="tenant-overview-panel tenant-activity-panel">
        <div className="tenant-panel-head"><h2>Recent Activity</h2><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => setShowActivities(true)}>View All Activity <i className="bi bi-arrow-right" /></button></div>
        <div className="tenant-activity-strip">{activities.map(([name, text, time, icon, tone, moduleName]) => <button type="button" className={`tenant-activity-item is-${tone}`} key={name} onClick={() => goModule(moduleName)}><i className={`bi ${icon}`} /><strong>{name}</strong><span>{text}</span><small>{time}</small></button>)}</div>
      </section>
      {showActivities ? (
        <>
          <div className="modal fade company-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header"><h2 className="modal-title h5">All Activity</h2><button type="button" className="btn-close" onClick={() => setShowActivities(false)} aria-label="Close" /></div>
                <div className="modal-body">
                  <div className="tenant-activity-list">{activities.map(([name, text, time, icon, tone, moduleName]) => <button type="button" className={`tenant-activity-list-item is-${tone}`} key={`${name}-${text}`} onClick={() => { setShowActivities(false); goModule(moduleName); }}><i className={`bi ${icon}`} /><span><strong>{name}</strong><small>{text}</small></span><em>{time}</em></button>)}</div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setShowActivities(false)}>Close</button><button type="button" className="btn btn-primary" onClick={() => { setShowActivities(false); goModule('platform-audit-logs'); }}>Open Audit Logs</button></div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      ) : null}
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

  if (module === 'overview') {
    return <TenantOverviewScreen rows={rows} />;
  }

  if (module === 'all-companies') {
    return <AllCompaniesScreen rows={rows} load={load} />;
  }

  if (module === 'company-status') {
    return <CompanyStatusScreen rows={rows} load={load} />;
  }

  if (module === 'company-requests') {
    return <CompanyRequestsScreen rows={rows} load={load} />;
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
