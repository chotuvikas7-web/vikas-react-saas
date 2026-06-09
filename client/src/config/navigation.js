const slug = (label) => label.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const adminModules = [
  { group: 'Dashboard', items: [{ label: 'Dashboard', path: '/admin' }] },
  { group: 'Email', items: [{ label: 'Inbox', path: '/admin/email' }] },
  { group: 'Masters', items: ['Clients', 'Suppliers', 'Categories', 'Products', 'Units', 'Brands', 'GST Rates'].map((label) => ({ label, path: `/admin/${slug(label)}` })).concat([{ label: 'Ledger', path: '/admin/ledger-master' }]) },
  { group: 'CRM', items: ['Leads', 'Enquiries', 'Follow Ups', 'Customer Activities', 'Client Communication', 'Quotations'].map((label) => ({ label, path: `/admin/${slug(label)}` })) },
  { group: 'Inventory', items: ['Stock', 'Purchases', 'Sales', 'Orders', 'Purchase Return', 'Sales Return', 'Stock Transfer', 'Low Stock Alerts'].map((label) => ({ label, path: `/admin/${slug(label)}` })) },
  { group: 'Manufacturing', items: ['Raw Materials', 'BOM', 'Production Orders', 'Work Orders', 'Finished Goods', 'Damage/Wastage', 'Production Reports'].map((label) => ({ label, path: `/admin/${slug(label)}` })) },
  { group: 'Accounting', items: ['Ledgers', 'Vouchers', 'Cash Book', 'Bank Book', 'Day Book', 'Payments', 'Expenses', 'Earnings', 'Journal Entries'].map((label) => ({ label, path: `/admin/${slug(label)}` })) },
  { group: 'GST & Invoicing', items: ['GST', 'Invoices', 'Credit Notes', 'Debit Notes', 'Proforma Invoices', 'E-Way Bill'].map((label) => ({ label, path: `/admin/${slug(label)}` })) },
  { group: 'Reports', items: ['Financial Reports', 'Inventory Reports', 'Manufacturing Reports', 'GST Reports', 'Sales Reports', 'Purchase Reports', 'Expense Reports', 'Outstanding Reports'].map((label) => ({ label, path: `/admin/${slug(label)}` })) },
  { group: 'Administration', items: ['Users', 'Roles & Permissions', 'Employees', 'Attendance', 'Leave Management', 'Salary', 'Activity Logs', 'Backup', 'Settings', 'Search Everything', 'Notifications', 'Import Data', 'Export Data', 'Document Uploads', 'Audit Logs'].map((label) => ({ label, path: label === 'Settings' ? '/admin/settings' : `/admin/${slug(label)}` })) },
  { group: 'Storefront', items: ['Products', 'Orders', 'Customers', 'Coupons', 'Reviews'].map((label) => ({ label, path: `/admin/${['Products', 'Orders', 'Customers'].includes(label) ? `storefront-${slug(label)}` : slug(label)}` })) }
];

export const superModules = [
  { group: 'Dashboard', items: [{ label: 'Dashboard', path: '/super-admin' }] },
  { group: 'Email', items: [{ label: 'Inbox', path: '/super-admin/email' }] },
  { group: 'Tenant Management', items: ['All Companies', 'Company Status', 'Company Details', 'Company Requests', 'Suspended Companies', 'Company Usage', 'Company Storage'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) },
  { group: 'Subscriptions', items: ['Active Subscriptions', 'Trial Subscriptions', 'Expired Subscriptions', 'Renewals', 'Upgrade Requests', 'Downgrade Requests', 'Cancelled Subscriptions'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) },
  { group: 'Plans & Features', items: ['Plans', 'Features', 'Feature Limits', 'Pricing Rules', 'Coupons', 'Free Plan', 'Starter Plan', 'Business Plan', 'Enterprise Plan', 'Module Access', 'Custom Pricing'].map((label) => ({ label, path: `/super-admin/modules/${label.includes('Plan') && !['Plans', 'Pricing Rules'].includes(label) ? `plan-${slug(label.replace(' Plan', ''))}` : slug(label)}` })) },
  { group: 'Users', items: ['All Users', 'Vendor Admins', 'Company Users', 'Staff Users', 'Super Admin Users', 'User Activity', 'Login History', 'User Permissions'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) },
  { group: 'Renewals & Billings', items: ['Subscription Payments', 'Invoices', 'Transactions', 'Refunds', 'Failed Payments', 'Revenue Reports'].map((label) => ({ label, path: `/super-admin/modules/${label === 'Invoices' ? 'billing-invoices' : slug(label)}` })) },
  { group: 'Support Center', items: ['Support Tickets', 'Ticket Categories', 'Ticket Assignment', 'Live Chat Requests', 'Contact Requests', 'Knowledge Base'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) },
  { group: 'Vendor Management', items: ['Vendor List', 'Vendor Verification', 'Vendor KYC', 'Vendor Documents', 'Vendor Status', 'Vendor Ratings'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) },
  { group: 'Integration', items: ['Payment Gateways', 'SMS Gateway', 'Email SMTP', 'WhatsApp API', 'Google Services', 'Webhooks', 'API Keys', 'Razorpay', 'Stripe', 'PayPal'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) },
  { group: 'Reports & Analytics', items: ['Revenue Reports', 'Subscription Reports', 'User Reports', 'Company Reports', 'Ticket Reports', 'Growth Reports', 'Churn Reports'].map((label) => ({ label, path: `/super-admin/modules/analytics-${slug(label.replace(' Reports', '').replace(' Report', ''))}` })) },
  { group: 'Security', items: ['Roles & Permissions', 'Login Logs', 'Audit Logs', 'Security Events', 'IP Restriction', 'Two Factor Authentication', 'Compliance Logs', 'Sessions'].map((label) => ({ label, path: `/super-admin/modules/${label === 'Roles & Permissions' ? 'platform-roles' : label === 'Login Logs' ? 'platform-login-logs' : label === 'Audit Logs' ? 'platform-audit-logs' : slug(label)}` })) },
  { group: 'System Settings', items: ['Platform Settings', 'Branding', 'Themes', 'SMTP Settings', 'SMS Settings', 'Payment Settings', 'Storage Settings', 'Notification Settings'].map((label) => ({ label, path: label === 'Themes' ? '/super-admin/themes' : `/super-admin/modules/${slug(label)}` })) },
  { group: 'Maintenance', items: ['Backup Management', 'Restore Management', 'Database Monitoring', 'Queue Monitoring', 'Cron Jobs', 'Cache Management', 'System Updates', 'Error Logs'].map((label) => ({ label, path: `/super-admin/modules/${slug(label)}` })) }
];

export const defaultFields = ['title', 'owner', 'reference', 'status', 'description'];
