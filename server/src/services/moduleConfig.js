export const adminModules = [
  { group: 'Dashboard', items: [{ label: 'Dashboard', path: '/admin', key: 'dashboard' }] },
  { group: 'Catalog', items: [{ label: 'Products', path: '/admin/products', key: 'products' }, { label: 'Categories', path: '/admin/categories', key: 'categories' }, { label: 'Stock', path: '/admin/stock', key: 'stock' }] },
  { group: 'Sales', items: [{ label: 'Orders', path: '/admin/orders', key: 'orders' }, { label: 'Invoices', path: '/admin/invoices', key: 'invoices' }, { label: 'Payments', path: '/admin/payments', key: 'payments' }] },
  { group: 'Administration', items: [{ label: 'Users', path: '/admin/users', key: 'users' }, { label: 'Roles & Permissions', path: '/admin/roles', key: 'roles' }, { label: 'Settings', path: '/admin/settings', key: 'settings' }] }
];

export const superModules = [
  { group: 'Dashboard', items: [{ label: 'Dashboard', path: '/super-admin', key: 'dashboard' }] },
  { group: 'Tenant Management', items: ['Company Details', 'Company Status', 'Company Request', 'Suspend Company'].map((label) => ({ label, path: `/super-admin/modules/${label.toLowerCase().replaceAll(' ', '-')}` })) },
  { group: 'Subscriptions', items: ['Active Subscriptions', 'Trial Subscriptions', 'Expired Subscriptions', 'Renewals', 'Upgrade Request', 'Downgrade Request', 'Cancelled Subscriptions'].map((label) => ({ label, path: `/super-admin/modules/${label.toLowerCase().replaceAll(' ', '-')}` })) },
  { group: 'Plans & Features', items: ['Plans', 'Features', 'Feature Limits', 'Pricing Rules', 'Coupons', 'Free Plan', 'Starter Plan', 'Business Plan', 'Enterprise Plan', 'Module Access', 'Custom Pricing'].map((label) => ({ label, path: `/super-admin/modules/${label.toLowerCase().replaceAll(' ', '-')}` })) },
  { group: 'Users', items: ['All Users', 'Vendor Admins', 'Company Users', 'Staff Users', 'Super Admin Users', 'User Activities', 'Login History', 'User Permission'].map((label) => ({ label, path: `/super-admin/modules/${label.toLowerCase().replaceAll(' ', '-')}` })) },
  { group: 'System Settings', items: ['Platform Settings', 'Branding', 'Theme Settings', 'SMTP Settings', 'SMS Settings', 'Payment Settings', 'Storage Settings', 'Notification Settings'].map((label) => ({ label, path: `/super-admin/modules/${label.toLowerCase().replaceAll(' ', '-')}` })) },
  { group: 'Maintenance', items: ['Backup Management', 'Restore Management', 'Database Monitoring', 'Queue Monitoring', 'Cron Jobs', 'Cache Management', 'System Update', 'Error Logs'].map((label) => ({ label, path: `/super-admin/modules/${label.toLowerCase().replaceAll(' ', '-')}` })) }
];
