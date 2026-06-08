import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, assetUrl } from '../api.js';
import { addCartItem, fallbackImage, money } from '../utils/storefront.js';

export function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api(`/public/products/${slug}`).then((data) => {
      setProduct(data.product);
      const gallery = [
        ...(data.product.main_image ? [assetUrl(data.product.main_image)] : []),
        ...(data.images || []).map((image) => assetUrl(image.image_path))
      ];
      setImages(gallery.length ? gallery : [fallbackImage(data.product), 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80']);
    }).catch(() => setProduct(null));
  }, [slug]);

  const shareText = useMemo(() => product ? `${product.name} - ${money(product.price)} | GST ${product.gst_rate || 18}%` : '', [product]);

  if (!product) return <section className="py-5"><div className="container"><div className="table-panel p-4">Loading product...</div></div></section>;

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5 product-detail-row">
          <div className="col-lg-6">
            <div className="carousel slide product-detail-slider">
              <div className="carousel-inner">
                {images.map((image, index) => (
                  <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={image}>
                    <button className="product-full-view-trigger" type="button" aria-label="Open image full view">
                      <img src={image} alt={`${product.name} ${index + 1}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-6 product-detail-content">
            <span className="category-pill">{product.category_name || 'Electronics'}</span>
            <h1 className="fw-bold mt-3">{product.name}</h1>
            <p className="text-muted">SKU: {product.sku} | Stock: {Number(product.stock_quantity || 0)}</p>
            <h2 className="h3 text-primary">{Number(product.price || 0) > 0 ? money(product.price) : 'Price on Enquiry'}</h2>
            <p className="text-muted">GST: {product.gst_rate || 18}% | Category: {product.category_name || 'Electronics'}</p>
            <p>{product.description}</p>
            <div className="d-flex gap-2 flex-wrap my-4">
              <input className="form-control" style={{ maxWidth: 110 }} type="number" min="1" value={qty} onChange={(event) => setQty(Math.max(1, Number(event.target.value || 1)))} />
              <button className="btn btn-primary" onClick={() => addCartItem(product.id, qty)}>Add to Cart</button>
              <button className="btn btn-accent" onClick={() => addCartItem(product.id, qty, true)}>Buy Now</button>
              <a className="btn btn-outline-success" target="_blank" rel="noreferrer" href={`https://wa.me/919999999999?text=${encodeURIComponent(`I want to enquire about ${product.name}`)}`}>WhatsApp Enquiry</a>
              <Link className="btn btn-outline-primary" to={`/contact?product_id=${product.id}`}>Enquiry Now</Link>
              <button className="btn btn-outline-secondary" type="button" onClick={() => navigator.clipboard?.writeText(`${shareText} | ${window.location.href}`)}><i className="bi bi-share" /> Share</button>
            </div>
            <div className="table-panel p-3">
              <h3 className="h5">Technical Specifications</h3>
              <p className="mb-0">{product.specifications || 'Specifications will be shared on enquiry.'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
