const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4100/api';

export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/uploads')) return `http://localhost:4100${path}`;
  if (path.startsWith('assets/')) return `http://localhost/vikas-electronics/${path}`;
  return path;
}

export async function api(path, options = {}) {
  const token = localStorage.getItem('ve_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function uploadAsset(folder, file) {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('ve_token');
  const response = await fetch(`${API_BASE}/uploads/${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Upload failed');
  return data;
}
