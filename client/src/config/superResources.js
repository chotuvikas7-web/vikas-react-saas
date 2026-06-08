const planModules = ['plans', 'features', 'feature-limits', 'pricing-rules', 'coupons', 'plan-free', 'plan-starter', 'plan-business', 'plan-enterprise', 'module-access', 'custom-pricing'];
const subscriptionModules = ['active-subscriptions', 'trial-subscriptions', 'expired-subscriptions', 'renewals', 'upgrade-requests', 'downgrade-requests', 'cancelled-subscriptions'];
const billingModules = ['subscription-payments', 'billing-invoices', 'transactions', 'refunds', 'failed-payments', 'revenue-reports'];
const supportModules = ['support-tickets', 'ticket-categories', 'ticket-assignment', 'ticket-assignments', 'live-chat', 'live-chat-requests', 'contact-requests', 'knowledge-base'];
const integrationModules = ['payment-gateways', 'sms-gateway', 'email-smtp', 'whatsapp-api', 'google-services', 'webhooks', 'api-keys', 'razorpay', 'stripe', 'paypal'];
const maintenanceModules = ['backup-management', 'restore-management', 'database-monitoring', 'queue-monitoring', 'cron-jobs', 'cache-management', 'system-updates', 'system-update', 'error-logs'];
const tenantModules = ['company-details', 'company-status', 'company-requests', 'company-request', 'suspended-companies', 'suspend-company', 'company-usage', 'company-storage', 'vendor-list'];

const configs = {
  plans: {
    columns: ['id', 'name', 'monthly_price', 'annual_price', 'user_limit', 'storage_limit_mb', 'status'],
    help: 'Create and manage SaaS pricing plans, limits and module access.'
  },
  subscriptions: {
    columns: ['id', 'company_name', 'plan_name', 'status', 'billing_cycle', 'amount', 'renews_at', 'ends_at'],
    help: 'Track active, trial, expired, renewal and cancellation subscription records.'
  },
  billing: {
    columns: ['id', 'invoice_no', 'company_name', 'amount', 'status', 'payment_gateway', 'transaction_ref', 'paid_at'],
    help: 'Manage SaaS invoices, transactions, refunds and failed payment records.'
  },
  support: {
    columns: ['id', 'company_name', 'subject', 'category', 'priority', 'status', 'assigned_to', 'created_at'],
    help: 'Manage tickets, categories, assignments, live chat and knowledge base records.'
  },
  integrations: {
    columns: ['id', 'provider', 'category', 'status', 'updated_at'],
    help: 'Configure payment, SMS, SMTP, WhatsApp, Google, webhook and API integrations.'
  },
  maintenance: {
    columns: ['id', 'job_type', 'status', 'message', 'started_at', 'finished_at'],
    help: 'Track backups, restores, database monitoring, queues, cron, cache and error jobs.'
  },
  tenants: {
    columns: ['id', 'company_name', 'owner_name', 'owner_email', 'plan_id', 'storage_used_mb', 'status', 'subscription_ends_at'],
    help: 'Manage company details, status, requests, suspension, usage and storage.'
  },
  records: {
    columns: ['id', 'title', 'owner', 'reference', 'status', 'amount', 'due_date', 'created_at'],
    help: 'Manage platform records with view, edit, delete and filter controls.'
  }
};

export function superResourceConfig(module) {
  if (planModules.includes(module)) return configs.plans;
  if (subscriptionModules.includes(module)) return configs.subscriptions;
  if (billingModules.includes(module)) return configs.billing;
  if (supportModules.includes(module)) return configs.support;
  if (integrationModules.includes(module)) return configs.integrations;
  if (maintenanceModules.includes(module)) return configs.maintenance;
  if (tenantModules.includes(module)) return configs.tenants;
  return configs.records;
}
