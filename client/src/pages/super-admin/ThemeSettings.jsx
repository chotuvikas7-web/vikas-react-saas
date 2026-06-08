import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export function ThemeSettings() {
  const [theme, setTheme] = useState(null);
  useEffect(() => {
    api('/super-admin/theme').then(setTheme).catch(console.error);
  }, []);
  return (
    <>
      <section className="super-panel super-theme-preview-panel" style={theme?.vars || {}}>
        <div className="super-panel-head"><h2>Live Theme Preview</h2><span>{theme?.record?.title || 'Active Theme'}</span></div>
        <div className="super-theme-preview-frame">
          <div className="super-theme-preview-shell">
            <aside className="super-theme-preview-sidebar" style={{ background: 'var(--super-sidebar-bg, #101828)', color: 'var(--super-sidebar-text, #fff)' }}>Sidebar</aside>
            <div className="super-theme-preview-content">
              <h2>{theme?.record?.title || 'Active Theme'}</h2>
              <button className="btn btn-primary">Primary Action</button>
              <p className="mt-3">Header, footer, sidebar, text contrast and fonts are controlled by the active theme.</p>
            </div>
          </div>
        </div>
      </section>
      <div className="notice">Theme editing API is connected to the existing PHP theme records and ready for the next migration pass.</div>
    </>
  );
}
