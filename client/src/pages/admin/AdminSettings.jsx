import { useEffect, useState } from 'react';
import { api, assetUrl, uploadAsset } from '../../api.js';

export function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/admin/settings').then((data) => setSettings(data.settings)).catch(console.error);
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);
    const next = { ...settings };
    for (const [key, value] of form.entries()) {
      if (value instanceof File && value.name) {
        const uploaded = await uploadAsset('settings', value);
        next[key] = uploaded.path;
      } else if (!(value instanceof File)) {
        next[key] = value;
      }
    }
    await api('/admin/settings', { method: 'PUT', body: JSON.stringify(next) });
    setSettings(next);
    setMessage('Settings saved.');
  };

  return (
    <>
      <h1>Settings</h1>
      {message && <div className="notice">{message}</div>}
      <form className="form-grid" onSubmit={save}>
        <label>Company Name<input name="company_name" defaultValue={settings.company_name || ''} /></label>
        <label>Phone<input name="phone" defaultValue={settings.phone || ''} /></label>
        <label>Email<input name="email" defaultValue={settings.email || ''} /></label>
        <label>Theme<select name="theme_mode" defaultValue={settings.theme_mode || 'dark'}><option>light</option><option>dark</option></select></label>
        <label>Logo<input type="file" name="logo" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.ico" /></label>
        <label>Favicon<input type="file" name="favicon" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.ico" /></label>
        <label className="span-2">Address<textarea name="address" defaultValue={settings.address || ''} /></label>
        {settings.logo && <img className="settings-preview" src={assetUrl(settings.logo)} alt="Logo" />}
        <button>Save Settings</button>
      </form>
    </>
  );
}
