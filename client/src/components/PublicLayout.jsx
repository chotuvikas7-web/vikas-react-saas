import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api, assetUrl } from '../api.js';
import { cartCount } from '../utils/storefront.js';

export function PublicLayout() {
  const [data, setData] = useState(null);
  const [count, setCount] = useState(cartCount());

  useEffect(() => {
    document.body.className = 'site-body site-theme-light';
    api('/public/bootstrap').then(setData).catch(console.error);
    const update = () => setCount(cartCount());
    window.addEventListener('ve-cart-change', update);
    window.addEventListener('storage', update);
    return () => {
      document.body.className = '';
      window.removeEventListener('ve-cart-change', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const settings = data?.settings || {};

  return (
    <div style={data?.theme?.vars || {}}>
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top site-navbar">
        <div className="container">
          <Link className="navbar-brand fw-bold site-brand" to="/">
            {settings.logo ? <img className="site-brand-logo" src={assetUrl(settings.logo)} alt={settings.company_name} /> : null}
            <span>{settings.company_name || 'Vikas Electronics'}</span>
          </Link>
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <NavLink className="nav-link" to="/">Home</NavLink>
            <NavLink className="nav-link" to="/about">About</NavLink>
            <NavLink className="nav-link" to="/products">Products</NavLink>
            <NavLink className="nav-link" to="/contact">Contact</NavLink>
            <NavLink className="btn btn-outline-light btn-sm site-cart-link" to="/cart" aria-label="Cart">
              <i className="bi bi-cart3" />
              <span className={`site-cart-count ${count ? '' : 'is-empty'}`} data-cart-count>{count}</span>
            </NavLink>
            <NavLink className="btn btn-accent btn-sm" to="/admin/login">Admin</NavLink>
          </div>
        </div>
      </nav>
      <Outlet context={{ settings, bootstrap: data }} />
      <footer className="footer-band mt-5 py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-5">
              <h5>Vikas Electronics Manufacture Company</h5>
              <p className="mb-0 text-white-50">Manufacturing jhatka machines, PCB cards, chargers and custom electronics products for dealers and businesses.</p>
            </div>
            <div className="col-md-3">
              <h6>Products</h6>
              <Link to="/products?category=jhatka-machines">Jhatka Machines</Link>
              <Link to="/products?category=pcb-cards">PCB Cards</Link>
              <Link to="/products?category=chargers">Battery Chargers</Link>
            </div>
            <div className="col-md-4">
              <h6>Enquiry</h6>
              <p className="mb-2 text-white-50">Need dealer pricing or custom manufacturing?</p>
              <a className="btn btn-accent btn-sm" href="https://wa.me/919999999999?text=I%20want%20to%20enquire%20about%20Vikas%20Electronics%20products" target="_blank" rel="noreferrer">WhatsApp Enquiry</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
