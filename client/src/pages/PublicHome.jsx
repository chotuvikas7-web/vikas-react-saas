import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { ProductCard } from '../components/ProductCard.jsx';

export function PublicHome() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('/public/products').then((result) => setProducts(result.rows.slice(0, 6))).catch(console.error);
  }, []);

  return (
    <>
      <section className="hero hero-slider" data-hero-slider aria-label="Vikas Electronics highlights">
        {[
          ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=85', 'Electronics Manufacturing and Supply', 'Jhatka machines, PCB cards, chargers and custom electronics.', 'Reliable products for dealers, repair shops and bulk buyers.'],
          ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1800&q=85', 'Tested Field Products', 'Stable machines and components built for everyday field use.', 'Chargers, transformers and control cards checked for dependable performance.'],
          ['https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=1800&q=85', 'Custom Manufacturing', 'From PCB assembly to bulk electronics product supply.', 'Manufacturing support for prototypes, repair networks and dealer demand.']
        ].map((slide, index) => (
          <article className={`hero-slide ${index === 0 ? 'is-active' : ''}`} key={slide[1]} style={{ '--slide-img': `url('${slide[0]}')` }}>
            <img src={slide[0]} alt={slide[1]} />
            <div className="hero-caption">
              <span>{slide[1]}</span>
              <h1>{slide[2]}</h1>
              <p>{slide[3]}</p>
              <div className="hero-actions">
                <Link className="btn btn-accent btn-lg" to="/products">View Products</Link>
                <Link className="btn btn-outline-light btn-lg" to="/contact">Send Enquiry</Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="py-5 section-band">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4"><div className="metric-card h-100"><h3 className="h5">Manufacturing Support</h3><p className="text-muted mb-0">PCB design, assembly, testing and bulk production for custom electronics.</p></div></div>
            <div className="col-md-4"><div className="metric-card h-100"><h3 className="h5">Dealer Friendly Pricing</h3><p className="text-muted mb-0">Products built for repeat buying, repair networks and wholesale supply.</p></div></div>
            <div className="col-md-4"><div className="metric-card h-100"><h3 className="h5">Tested Components</h3><p className="text-muted mb-0">Cards, transformers and chargers checked for stable field performance.</p></div></div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div><h2 className="fw-bold">Featured Products</h2><p className="text-muted mb-0">Manufactured and supplied by Vikas Electronics.</p></div>
            <Link className="btn btn-outline-primary" to="/products">All Products</Link>
          </div>
          <div className="catalog-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>
    </>
  );
}
