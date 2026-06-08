import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const adminGroupIcons = {
  Dashboard: 'bi-speedometer2',
  Email: 'bi-envelope-paper',
  Masters: 'bi-grid',
  CRM: 'bi-person-lines-fill',
  Inventory: 'bi-boxes',
  Manufacturing: 'bi-motherboard',
  Accounting: 'bi-calculator',
  'GST & Invoicing': 'bi-percent',
  Reports: 'bi-bar-chart-line',
  Administration: 'bi-gear',
  Storefront: 'bi-shop'
};

const superGroupIcons = {
  Dashboard: 'bi-speedometer2',
  Email: 'bi-envelope-paper',
  'Tenant Management': 'bi-buildings',
  Subscriptions: 'bi-arrow-repeat',
  'Plans & Features': 'bi-box2-heart',
  Users: 'bi-people',
  'Renewals & Billings': 'bi-credit-card',
  'Support Center': 'bi-life-preserver',
  'Vendor Management': 'bi-shop-window',
  Integration: 'bi-plug',
  'Reports & Analytics': 'bi-graph-up-arrow',
  Security: 'bi-shield-check',
  'System Settings': 'bi-gear',
  Maintenance: 'bi-tools'
};

const childIcon = (label) => ({
  Dashboard: 'bi-speedometer2',
  Inbox: 'bi-inbox',
  Clients: 'bi-people',
  Suppliers: 'bi-truck',
  Categories: 'bi-tags',
  Products: 'bi-cpu',
  Settings: 'bi-sliders',
  Themes: 'bi-moon-stars',
  'Support Tickets': 'bi-ticket-detailed',
  'Live Chat Requests': 'bi-chat-dots'
}[label] || 'bi-dot');

const matchesPath = (pathname, path) => pathname === path || (!['/admin', '/super-admin'].includes(path) && pathname.startsWith(`${path}/`));

export function Sidebar({ title, logo, modules, type, onLogout, mobileOpen = false, collapsed = false, onCloseMobile }) {
  const { pathname } = useLocation();
  const isSuper = type === 'super-admin';
  const groupIcons = isSuper ? superGroupIcons : adminGroupIcons;
  const activeGroupName = modules.find((group) => group.items.some((item) => matchesPath(pathname, item.path)))?.group || '';
  const [openGroup, setOpenGroup] = useState(activeGroupName);

  useEffect(() => {
    setOpenGroup(activeGroupName);
  }, [activeGroupName]);

  const toggleGroup = (group) => {
    setOpenGroup((current) => (current === group ? '' : group));
  };
  const linkClick = () => onCloseMobile?.();

  if (isSuper) {
    return (
      <aside className={`super-sidebar ${mobileOpen ? 'is-mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`} id="superSidebar">
        <div className="super-brand">
          {logo ? <img src={logo} alt={title} /> : <span>VE</span>}
          <div><strong>Vikas ERP</strong><small>Super Admin</small></div>
          <button className="btn-close d-lg-none ms-auto" type="button" onClick={onCloseMobile} aria-label="Close menu" />
        </div>
        <nav className="super-nav" id="superAdminNav">
          {modules.map((group) => {
            const active = group.group === activeGroupName;
            const open = openGroup === group.group;
            const hasSingle = group.items.length === 1 && group.items[0].label === group.group;
            if (hasSingle) {
              return <NavLink key={group.group} onClick={linkClick} className={({ isActive }) => `super-nav-link super-nav-single ${isActive ? 'is-active' : ''}`} to={group.items[0].path} end><i className={`bi ${groupIcons[group.group] || 'bi-circle'}`} /><span>{group.group}</span></NavLink>;
            }
            return (
              <div className="super-nav-group" key={group.group}>
                <button className={`super-nav-link super-nav-toggle ${active ? 'is-active' : ''} ${open ? '' : 'collapsed'}`} type="button" onClick={() => toggleGroup(group.group)} aria-expanded={open}>
                  <span><i className={`bi ${groupIcons[group.group] || 'bi-circle'}`} />{group.group}</span>
                  <i className="bi bi-chevron-down" />
                </button>
                <div className={`collapse ${open ? 'show' : ''}`}>
                  {group.items.map((item) => (
                    <NavLink key={item.path} onClick={linkClick} className={({ isActive }) => `super-nav-child ${isActive && active ? 'is-active' : ''}`} to={item.path}>
                      <i className={`bi ${childIcon(item.label)}`} /><span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
          <button className="super-nav-link super-nav-single w-100 border-0" type="button" onClick={onLogout}><i className="bi bi-box-arrow-right" /><span>Logout</span></button>
        </nav>
      </aside>
    );
  }

  return (
    <aside className={`admin-sidebar ${mobileOpen ? 'is-mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="brand admin-brand">
          {logo ? <img className="admin-brand-logo" src={logo} alt={title} /> : null}
          <span>{title}</span>
        </div>
        <button className="btn-close btn-close-white d-lg-none" type="button" onClick={onCloseMobile} aria-label="Close menu" />
      </div>
      <nav className="admin-nav" id="adminSidebarNav">
        {modules.map((group) => {
          const active = group.group === activeGroupName;
          const open = openGroup === group.group;
          const hasSingle = group.items.length === 1 && group.items[0].label === group.group;
          if (hasSingle) {
            return <NavLink key={group.group} onClick={linkClick} className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`} to={group.items[0].path} end><i className={`bi ${groupIcons[group.group] || 'bi-circle'}`} /> {group.group}</NavLink>;
          }
          return (
            <div className="admin-nav-group" key={group.group}>
              <button className={`admin-nav-link admin-nav-toggle ${active ? 'is-active' : ''} ${open ? '' : 'collapsed'}`} type="button" onClick={() => toggleGroup(group.group)} aria-expanded={open}>
                <span><i className={`bi ${groupIcons[group.group] || 'bi-circle'}`} /> {group.group}</span>
                <i className="bi bi-chevron-down admin-nav-arrow" />
              </button>
              <div className={`admin-nav-children collapse ${open ? 'show' : ''}`}>
                {group.items.map((item) => (
                  <NavLink key={item.path} onClick={linkClick} className={({ isActive }) => `admin-nav-child ${isActive && active ? 'is-active' : ''}`} to={item.path}>
                    <i className={`bi ${childIcon(item.label)}`} /><span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
        <button className="admin-nav-link w-100 border-0" type="button" onClick={onLogout}><i className="bi bi-box-arrow-right" /> Logout</button>
      </nav>
    </aside>
  );
}
