import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, assetUrl } from '../api.js';
import { cartItems, fallbackImage, money, saveCart } from '../utils/storefront.js';

export function Checkout() {
  const [items] = useState(cartItems());
  const [products, setProducts] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState({ country: 'India', state: 'Uttar Pradesh' });

  useEffect(() => {
    document.body.className = 'checkout-body site-theme-light';
    api('/public/cart/products', { method: 'POST', body: JSON.stringify({ items }) }).then((data) => setProducts(data.rows)).catch(() => setProducts([]));
    return () => { document.body.className = ''; };
  }, []);

  const lines = useMemo(() => products.map((product) => ({ product, quantity: items.find((item) => Number(item.id) === Number(product.id))?.quantity || 1 })), [products, items]);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price || 0) * line.quantity, 0);
  const gst = lines.reduce((sum, line) => sum + Number(line.product.price || 0) * line.quantity * Number(line.product.gst_rate || 18) / 100, 0);

  const submit = async () => {
    try {
      setError('');
      const result = await api('/public/checkout', { method: 'POST', body: JSON.stringify({ items, customer }) });
      saveCart([]);
      setSuccess(result.invoice_no);
    } catch (exception) {
      setError(exception.message);
    }
  };

  const next = (event) => {
    event.preventDefault();
    const form = event.currentTarget.closest('form');
    if (step === 1 && !form.reportValidity()) return;
    setStep((value) => Math.min(3, value + 1));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    await submit();
  };

  if (success) {
    return (
      <main className="checkout-success-page">
        <div className="checkout-success-card">
          <span className="checkout-success-icon"><i className="bi bi-check2" /></span>
          <h1>Order Placed Successfully</h1>
          <p>Your order has been received. Our team will contact you for payment and dispatch.</p>
          <div className="checkout-success-invoice">Invoice: <strong>{success}</strong></div>
          <Link className="checkout-submit checkout-success-link" to="/products">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="checkout-topbar">
        <Link className="checkout-logo" to="/">VIKAS</Link>
        <div className="checkout-secure"><i className="bi bi-lock-fill" /> Secure Checkout</div>
        <Link className="checkout-return" to="/cart"><i className="bi bi-arrow-left" /> Return to Cart</Link>
      </header>
      <main className="checkout-page">
        <div className="checkout-steps" aria-label="Checkout progress">
          <div className={`checkout-step ${step >= 1 ? 'active' : ''}`}><span>1</span><strong>Shipping</strong></div>
          <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}><span>2</span><strong>Payment</strong></div>
          <div className={`checkout-step ${step >= 3 ? 'active' : ''}`}><span>3</span><strong>Review</strong></div>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <div className="checkout-grid">
          <section className="checkout-form-area">
            <h1>Shipping Information</h1>
            <p>Please enter your shipping details.</p>
            <form className="checkout-form" onSubmit={placeOrder}>
              <div className={`checkout-pane ${step === 1 ? 'active' : ''}`} data-checkout-pane="1">
                <div className="checkout-field-row two">
                  <label className="checkout-field"><span>First Name</span><input required value={customer.first_name || ''} onChange={(event) => setCustomer({ ...customer, first_name: event.target.value })} /></label>
                  <label className="checkout-field"><span>Last Name</span><input required value={customer.last_name || ''} onChange={(event) => setCustomer({ ...customer, last_name: event.target.value })} /></label>
                </div>
                <label className="checkout-field"><span>Email Address</span><input type="email" required value={customer.email || ''} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} /></label>
                <label className="checkout-field"><span>Phone Number</span><input required value={customer.mobile || ''} onChange={(event) => setCustomer({ ...customer, mobile: event.target.value })} /></label>
                <label className="checkout-field select"><span>Country / Region</span><select value={customer.country || 'India'} onChange={(event) => setCustomer({ ...customer, country: event.target.value })}><option value="India">India</option></select></label>
                <label className="checkout-field"><span>Street Address</span><input required value={customer.street_address || ''} onChange={(event) => setCustomer({ ...customer, street_address: event.target.value })} /></label>
                <label className="checkout-field"><span>Apartment, suite, unit, etc. (optional)</span><input value={customer.address_line_2 || ''} onChange={(event) => setCustomer({ ...customer, address_line_2: event.target.value })} /></label>
                <div className="checkout-field-row three">
                  <label className="checkout-field"><span>City</span><input required value={customer.city || ''} onChange={(event) => setCustomer({ ...customer, city: event.target.value })} /></label>
                  <label className="checkout-field select"><span>State</span><select value={customer.state || 'Uttar Pradesh'} onChange={(event) => setCustomer({ ...customer, state: event.target.value })}><option>Uttar Pradesh</option><option>Delhi</option><option>Haryana</option><option>Rajasthan</option></select></label>
                  <label className="checkout-field"><span>ZIP Code</span><input required value={customer.zip_code || ''} onChange={(event) => setCustomer({ ...customer, zip_code: event.target.value })} /></label>
                </div>
                <label className="checkout-field"><span>GST Number (optional)</span><input value={customer.gst_number || ''} onChange={(event) => setCustomer({ ...customer, gst_number: event.target.value })} /></label>
              </div>
              <div className={`checkout-pane ${step === 2 ? 'active' : ''}`} data-checkout-pane="2">
                <div className="checkout-payment-box">
                  <h2>Payment Method</h2>
                  <p>Payment will be collected after order confirmation. Our team will contact you with payment details.</p>
                  <label className="checkout-radio"><input type="radio" checked readOnly /><span><strong>Pay after confirmation</strong><small>UPI, bank transfer, or cash terms will be shared by our team.</small></span></label>
                </div>
              </div>
              <div className={`checkout-pane ${step === 3 ? 'active' : ''}`} data-checkout-pane="3">
                <div className="checkout-review-box">
                  <h2>Review Order</h2>
                  <p>Please confirm your shipping and order details before placing the order.</p>
                  <div className="checkout-review-lines">
                    <div><strong>Name</strong><span>{`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '-'}</span></div>
                    <div><strong>Email</strong><span>{customer.email || '-'}</span></div>
                    <div><strong>Phone</strong><span>{customer.mobile || '-'}</span></div>
                    <div><strong>Address</strong><span>{[customer.street_address, customer.address_line_2, customer.city, customer.state, customer.zip_code, customer.country].filter(Boolean).join(', ') || '-'}</span></div>
                    <div><strong>Payment</strong><span>Pay after confirmation</span></div>
                  </div>
                </div>
              </div>
              <div className="checkout-nav-actions">
                <button className="checkout-back" type="button" hidden={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</button>
                <button className="checkout-submit" hidden={step === 3} disabled={!lines.length} type="button" onClick={next}>{step === 1 ? 'Continue to Payment' : 'Continue to Review'}</button>
                <button className="checkout-submit" hidden={step !== 3} disabled={!lines.length} type="submit">Place Order</button>
              </div>
            </form>
          </section>
          <aside className="checkout-summary" aria-label="Order summary">
            <h2>Order Summary</h2>
            <div className="checkout-items">
              {lines.map(({ product, quantity }) => (
                <div className="checkout-item" key={product.id}>
                  <img src={product.main_image ? assetUrl(product.main_image) : fallbackImage(product)} alt={product.name} />
                  <div><h3>{product.name}</h3><p>SKU: {product.sku}</p><p>Qty: {quantity}</p></div>
                  <strong>{money(Number(product.price || 0) * quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="checkout-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Shipping</span><strong>Free</strong></div><div><span>GST</span><strong>{money(gst)}</strong></div></div>
            <div className="checkout-total"><span>Total</span><strong>{money(subtotal + gst)}</strong></div>
            <div className="checkout-lock"><i className="bi bi-lock-fill" /> Secure and encrypted checkout</div>
            <div className="checkout-payments"><span>We accept</span><b>VISA</b><b>MC</b><b>AMEX</b><b>UPI</b></div>
          </aside>
        </div>
      </main>
    </>
  );
}
