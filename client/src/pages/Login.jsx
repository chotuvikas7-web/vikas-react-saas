import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Login({ type = 'admin' }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: type === 'super-admin' ? 'super@vikaselectronics.local' : 'admin@vikaselectronics.local', password: 'admin123', tenant: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.className = 'section-band site-theme-light';
    return () => { document.body.className = ''; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(type, form);
      navigate(type === 'super-admin' ? '/super-admin' : '/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="form-panel p-4 p-md-5" style={{ maxWidth: type === 'super-admin' ? 460 : 440, width: '100%' }}>
        <h1 className="h3 fw-bold mb-2">{type === 'super-admin' ? 'Super Admin' : 'Admin Login'}</h1>
        <p className="text-muted mb-4">{type === 'super-admin' ? 'Create and manage business tenants.' : 'Secure access for business operations.'}</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit}>
          {type === 'admin' && <div className="mb-3"><label className="form-label" htmlFor="tenant-slug">Tenant Slug</label><input id="tenant-slug" className="form-control" placeholder="vikas-electronics" value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })} /></div>}
          <div className="mb-3"><label className="form-label" htmlFor={`${type}-email`}>Email</label><input id={`${type}-email`} className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="mb-3"><label className="form-label" htmlFor={`${type}-password`}>Password</label><input id={`${type}-password`} className="form-control" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <button className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </main>
  );
}
