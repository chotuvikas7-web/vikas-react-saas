import { Link } from 'react-router-dom';
import { assetUrl } from '../api.js';
import { addCartItem, excerpt, fallbackImage } from '../utils/storefront.js';

export function ProductCard({ product, hidden = false }) {
  const image = product.main_image ? assetUrl(product.main_image) : fallbackImage(product);
  return (
    <article className={`catalog-card tech-product-card ${hidden ? 'is-hidden' : ''}`} data-product-card>
      <Link className="catalog-card-image tech-card-image" to={`/product/${product.slug || product.id}`}>
        <img src={image} alt={product.name} />
      </Link>
      <div className="catalog-card-body tech-card-panel">
        <span className="tech-card-brand">Vikas</span>
        {product.category_name || product.category ? <Link className="catalog-pill tech-card-chip" to={`/products?category=${product.category_slug || product.category_name}`}>{product.category_name || product.category}</Link> : null}
        <h2>{product.name}</h2>
        <p>{excerpt(product.description)}</p>
        <div className="tech-card-features">
          <span><i className="bi bi-check-circle-fill" /> Tested product</span>
          <span><i className="bi bi-cpu-fill" /> Stable output</span>
          <span><i className="bi bi-box-seam-fill" /> Dealer supply</span>
          <span><i className="bi bi-tools" /> Custom support</span>
        </div>
      </div>
      <div className="tech-card-actions">
        <button className="catalog-details tech-card-action tech-card-cart" type="button" onClick={() => addCartItem(product.id)}>
          <i className="bi bi-cart-plus" /> Add to Cart
        </button>
        <Link className="catalog-details tech-card-action" to={`/product/${product.slug || product.id}`}>View Details</Link>
      </div>
    </article>
  );
}
