import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { ProductCard } from '../components/ProductCard.jsx';

const categoryIcons = {
  'jhatka-machines': 'bi-lightning-charge',
  transformers: 'bi-cpu',
  chargers: 'bi-battery-charging',
  'pcb-cards': 'bi-motherboard',
  'custom-manufacturing': 'bi-tools'
};

export function Products() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visible, setVisible] = useState(8);
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'latest';

  useEffect(() => {
    api('/public/bootstrap').then((data) => setCategories(data.categories || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setVisible(8);
    api(`/public/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`)
      .then((data) => setRows(data.rows))
      .catch(() => setRows([]));
  }, [q, category, sort]);

  const update = (values) => setParams(Object.fromEntries(Object.entries({ category, q, sort, ...values }).filter(([, value]) => value)));
  const activeCategoryName = useMemo(() => categories.find((cat) => cat.slug === category)?.name || 'Products', [categories, category]);

  return (
    <main className="products-page">
      <div className="products-shell">
        <aside className="catalog-sidebar" aria-label="Product categories">
          <div className="catalog-sidebar-title">Product Categories</div>
          <nav className="catalog-nav">
            <Link className={category === '' ? 'active' : ''} to="/products"><i className="bi bi-grid" /><span>All Products</span></Link>
            {categories.map((cat) => (
              <Link className={category === cat.slug ? 'active' : ''} key={cat.id} to={`/products?category=${cat.slug}`}>
                <i className={`bi ${categoryIcons[cat.slug] || 'bi-box-seam'}`} />
                <span>{cat.name}</span>
                <i className="bi bi-chevron-right ms-auto" />
              </Link>
            ))}
          </nav>
          <div className="catalog-help">
            <span className="catalog-help-icon"><i className="bi bi-headset" /></span>
            <div><h2>Need Custom Product?</h2><p>We manufacture electronics products as per your requirement.</p><Link to="/contact">Contact Us <i className="bi bi-arrow-right" /></Link></div>
          </div>
          <ul className="catalog-trust">
            <li><i className="bi bi-shield-check" /> Quality Assured</li>
            <li><i className="bi bi-hand-thumbs-up" /> Reliable Performance</li>
            <li><i className="bi bi-people" /> Customer Satisfaction</li>
          </ul>
        </aside>

        <section className="catalog-content">
          <div className="catalog-toolbar">
            <div>
              <div className="catalog-crumb"><i className="bi bi-house-door" /> / {activeCategoryName}</div>
              <h1>Our Products</h1>
              <p>High quality electronic products manufactured with precision and care.</p>
            </div>
            <form className="catalog-filters" onSubmit={(event) => event.preventDefault()}>
              <div className="catalog-search">
                <input value={q} placeholder="Search products..." aria-label="Search products" onChange={(event) => update({ q: event.target.value })} />
                <button type="button" aria-label="Search"><i className="bi bi-search" /></button>
              </div>
              <label className="catalog-sort">
                <span>Sort by:</span>
                <select value={sort} onChange={(event) => update({ sort: event.target.value })} aria-label="Sort products">
                  <option value="latest">Latest</option>
                  <option value="name">Name</option>
                  <option value="price-low">Price Low</option>
                  <option value="price-high">Price High</option>
                </select>
              </label>
            </form>
          </div>

          {!rows.length ? (
            <div className="catalog-empty">
              <h2>No products found</h2>
              <p>Try another search term or choose a different category.</p>
              <Link className="btn btn-primary" to="/products">View All Products</Link>
            </div>
          ) : (
            <>
              <div className="catalog-grid" data-product-grid>
                {rows.slice(0, visible).map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              {rows.length > visible ? (
                <div className="catalog-load-more">
                  <button className="catalog-load-button" type="button" onClick={() => setVisible((value) => value + 4)}>
                    <span className="load-label">Load More Products</span>
                    <span className="load-spinner" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
