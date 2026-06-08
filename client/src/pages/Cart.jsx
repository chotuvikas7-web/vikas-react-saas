import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { cartItems, money, saveCart } from '../utils/storefront.js';

export function Cart() {
  const [items, setItems] = useState(cartItems());
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api('/public/cart/products', { method: 'POST', body: JSON.stringify({ items }) }).then((data) => setProducts(data.rows)).catch(() => setProducts([]));
  }, [items]);

  const lines = useMemo(() => products.map((product) => ({ product, quantity: items.find((item) => Number(item.id) === Number(product.id))?.quantity || 1 })), [products, items]);
  const total = lines.reduce((sum, line) => sum + Number(line.product.price || 0) * Number(line.quantity || 1), 0);

  const remove = (id) => {
    const next = items.filter((item) => Number(item.id) !== Number(id));
    setItems(next);
    saveCart(next);
  };

  return (
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-4">Cart</h1>
        <div className="table-panel p-3">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th /></tr></thead>
              <tbody>
                {lines.map(({ product, quantity }) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{quantity}</td>
                    <td>{money(product.price)}</td>
                    <td>{money(Number(product.price || 0) * quantity)}</td>
                    <td><button className="btn btn-sm btn-outline-danger" onClick={() => remove(product.id)}>Remove</button></td>
                  </tr>
                ))}
                {!lines.length ? <tr><td colSpan="5">Your cart is empty.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h4 mb-0">Total: {money(total)}</h2>
            <Link className={`btn btn-accent ${lines.length ? '' : 'disabled'}`} to="/checkout">Checkout</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
