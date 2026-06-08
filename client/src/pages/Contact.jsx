import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

export function Contact() {
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: params.get('product_id') || '', subject: 'Product enquiry' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/public/products?sort=name').then((data) => setProducts(data.rows)).catch(() => setProducts([]));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const result = await api('/public/enquiries', { method: 'POST', body: JSON.stringify(form) });
    setMessage(result.message);
    setForm({ product_id: '', subject: 'Product enquiry' });
  };

  return (
    <>
      <section className="py-5 section-band">
        <div className="container">
          <h1 className="fw-bold">Contact Vikas Electronics</h1>
          <p className="text-muted">Send an enquiry for product pricing, dealer supply, repair parts or custom electronics manufacturing.</p>
        </div>
      </section>
      <section className="py-5">
        <div className="container">
          {message ? <div className="alert alert-success">{message}</div> : null}
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="metric-card h-100">
                <h2 className="h5">Business Enquiry</h2>
                <p className="text-muted">Phone: +91 99999 99999</p>
                <p className="text-muted">Email: sales@vikaselectronics.local</p>
                <p className="text-muted">Address: Electronics manufacturing unit, India</p>
                <a className="btn btn-outline-success" target="_blank" rel="noreferrer" href="https://wa.me/919999999999">Open WhatsApp</a>
              </div>
            </div>
            <div className="col-lg-7">
              <form className="form-panel p-4" onSubmit={submit}>
                <div className="row g-3">
                  <div className="col-md-6"><label className="form-label">Name</label><input className="form-control" required value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Mobile</label><input className="form-control" required value={form.mobile || ''} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label">Product</label><select className="form-select" value={form.product_id || ''} onChange={(event) => setForm({ ...form, product_id: event.target.value })}><option value="">General enquiry</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></div>
                  <div className="col-12"><label className="form-label">Subject</label><input className="form-control" value={form.subject || ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></div>
                  <div className="col-12"><label className="form-label">Message</label><textarea className="form-control" rows="4" value={form.message || ''} onChange={(event) => setForm({ ...form, message: event.target.value })} /></div>
                </div>
                <button className="btn btn-primary mt-4">Send Enquiry</button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <section className="contact-map-section">
        <div className="contact-map-header"><h2>Vikas Electronics</h2><p>Village Jarara, Post Jarara, Tehsil Khair, District Aligarh, Uttar Pradesh 202138</p></div>
        <iframe className="contact-map" title="Vikas Electronics location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Vikas%20Electronics%20Village%20Jarara%20Post%20Jarara%20Tehsil%20Khair%20District%20Aligarh%20Uttar%20Pradesh%20202138&output=embed" />
      </section>
    </>
  );
}
