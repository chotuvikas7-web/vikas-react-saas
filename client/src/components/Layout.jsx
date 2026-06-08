import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function titleFromPath(pathname, fallback) {
  if (pathname.includes('/admin/clients/form')) return 'Client Form';
  if (pathname.includes('/admin/clients/profile')) return 'Client Profile';
  if (pathname.includes('/admin/suppliers/form')) return 'Supplier Form';
  if (pathname.includes('/admin/suppliers/profile')) return 'Supplier Profile';
  if (pathname.includes('/admin/categories/form')) return 'Category Form';
  if (pathname.includes('/admin/products/form')) return 'Product Form';
  const last = pathname.split('/').filter(Boolean).pop() || fallback;
  if (last === 'admin') return 'Dashboard';
  if (last === 'super-admin') return 'Dashboard';
  const adminTitles = {
    enquiries: 'Inquiry',
    stock: 'Stock Management',
    purchases: 'Purchase Management',
    sales: 'Sales Invoices',
    payments: 'Payment Ledger',
    expenses: 'Daily Expenses',
    earnings: 'Daily Earnings',
    gst: 'GST / Tax Ledger',
    invoices: 'Invoices',
    users: 'User Management',
    ledgers: 'Ledgers',
    vouchers: 'Vouchers',
    'cash-book': 'Accounting Books',
    'bank-book': 'Accounting Books',
    'journal-entries': 'Create Voucher',
    'payment-client': 'Client Payment Received',
    'payment-supplier': 'Supplier Payment Paid'
  };
  if (adminTitles[last]) return adminTitles[last];
  return last.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AppLayout({ title, logo, modules, type = 'admin' }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuper = type === 'super-admin';
  const pageTitle = titleFromPath(location.pathname, title);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.className = isSuper ? 'super-admin-body' : 'admin-body admin-theme-light';
    if (isSuper) {
      document.body.dataset.superTheme = 'light';
      delete document.body.dataset.platformLayout;
    } else {
      document.body.dataset.platformLayout = 'fluid';
      delete document.body.dataset.superTheme;
      document.body.style.setProperty('--sidebar-bg', '#1A2027');
      document.body.style.setProperty('--sidebar-text', '#ffffff');
      document.body.style.setProperty('--sidebar-muted', '#cbd5e1');
    }
    return () => {
      document.body.className = '';
      delete document.body.dataset.superTheme;
      delete document.body.dataset.platformLayout;
      document.body.style.removeProperty('--sidebar-bg');
      document.body.style.removeProperty('--sidebar-text');
      document.body.style.removeProperty('--sidebar-muted');
    };
  }, [isSuper]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const className = isSuper ? 'super-sidebar-collapsed' : 'admin-sidebar-collapsed';
    document.body.classList.toggle(className, collapsed);
    return () => document.body.classList.remove(className);
  }, [collapsed, isSuper]);

  return isSuper ? (
    <div className={`super-admin-shell ${collapsed ? 'is-sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <Sidebar title={title} logo={logo} modules={modules} type={type} mobileOpen={mobileOpen} collapsed={collapsed} onCloseMobile={() => setMobileOpen(false)} onLogout={() => { logout(); navigate('/'); }} />
      <main className="super-main">
        <header className="super-topbar">
          <div className="super-topbar-start">
            <button className="super-icon-btn d-lg-none" type="button" onClick={() => setMobileOpen(true)}><i className="bi bi-list" /></button>
            <button className="super-icon-btn d-none d-lg-inline-flex" type="button" onClick={() => setCollapsed((value) => !value)}><i className="bi bi-list" /></button>
            <div className="super-search"><i className="bi bi-search" /><span>Search tenants, billing, tickets...</span><kbd>Ctrl K</kbd></div>
          </div>
          <div className="super-topbar-actions">
            <button className="super-icon-btn" type="button" title="Theme"><i className="bi bi-moon-stars" /></button>
            <button className="super-icon-btn" type="button" title="Notifications"><i className="bi bi-bell" /><span /></button>
            <button className="super-profile" type="button"><span>{(user?.name || 'S')[0]}</span><strong>{user?.name || 'Super Admin'}</strong><i className="bi bi-chevron-down" /></button>
          </div>
        </header>
        <section className="super-page-head">
          <nav aria-label="breadcrumb"><ol className="breadcrumb mb-1"><li className="breadcrumb-item">Super Admin</li><li className="breadcrumb-item active">{pageTitle}</li></ol></nav>
          <h1>{pageTitle}</h1>
        </section>
        <Outlet />
      </main>
    </div>
  ) : (
    <div className={`admin-shell ${collapsed ? 'is-sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="sidebar-scrim" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <Sidebar title={title} logo={logo} modules={modules} type={type} mobileOpen={mobileOpen} collapsed={collapsed} onCloseMobile={() => setMobileOpen(false)} onLogout={() => { logout(); navigate('/'); }} />
      <main className="admin-main">
        <div className="admin-topbar d-flex justify-content-between align-items-center">
          <div className="admin-topbar-start">
            <button className="admin-topbar-icon d-lg-none" type="button" onClick={() => setMobileOpen(true)}><i className="bi bi-list" /></button>
            <button className="admin-topbar-icon d-none d-lg-inline-flex" type="button" onClick={() => setCollapsed((value) => !value)}><i className="bi bi-list" /></button>
            <div>
              <h1 className="h5 mb-0">{pageTitle}</h1>
              <p className="text-muted mb-0">Business operations, invoices, ledger and stock control.</p>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <form className="admin-topbar-search d-none d-md-flex">
              <i className="bi bi-search" />
              <input placeholder="Search..." aria-label="Search" />
            </form>
            <a className="admin-topbar-icon admin-notification-link" href="#notifications" title="Enquiries"><i className="bi bi-bell" /></a>
            <div className="admin-user-chip"><span>{(user?.name || 'A')[0]}</span><strong>{user?.name || 'Admin'}</strong></div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
