import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';

const emptyLine = { product_id: '', quantity: 1, price: 0, discount: 0, gst: 18 };
const today = () => new Date().toISOString().slice(0, 10);

export function AdminCreateOrderModal({ open, onClose, onCreated }) {
  const [options, setOptions] = useState({ clients: [], products: [] });
  const [form, setForm] = useState({ order_date: today(), paid_amount: 0, payment_method: 'Cash', notes: '' });
  const [items, setItems] = useState([{ ...emptyLine }]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    api('/admin/order-create-options').then(setOptions).catch((exception) => setError(exception.message));
  }, [open]);

  const lines = useMemo(() => items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const discount = Number(item.discount || 0);
    const gst = Number(item.gst || 0);
    const taxable = Math.max(quantity * price - discount, 0);
    return { ...item, lineTotal: taxable + taxable * gst / 100 };
  }), [items]);
  const grandTotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);

  if (!open) return null;

  const setItem = (index, patch) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const chooseProduct = (index, productId) => {
    const product = options.products.find((row) => Number(row.id) === Number(productId));
    setItem(index, { product_id: productId, price: product?.price || 0, gst: product?.gst_rate || 18 });
  };
  const submit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const payload = { ...form, client_id: form.client_id || options.clients[0]?.id, items };
      const result = await api('/admin/orders/create', { method: 'POST', body: JSON.stringify(payload) });
      onCreated?.(result);
      onClose();
    } catch (exception) {
      setError(exception.message);
    }
  };

  return (
    <>
    <div className="modal fade admin-form-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h2 className="modal-title h5">Create Order</h2>
            <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            {error ? <div className="alert alert-danger">{error}</div> : null}
            <div className="form-panel p-4">
              <div className="row g-3 mb-3">
                <div className="col-md-4"><label className="form-label">Client</label><select className="form-select" value={form.client_id || ''} required onChange={(event) => setForm({ ...form, client_id: event.target.value })}>{options.clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></div>
                <div className="col-md-3"><label className="form-label">Order Date</label><input className="form-control" type="date" value={form.order_date} onChange={(event) => setForm({ ...form, order_date: event.target.value })} /></div>
                <div className="col-md-3"><label className="form-label">Paid Amount</label><input className="form-control" type="number" step="0.01" value={form.paid_amount} onChange={(event) => setForm({ ...form, paid_amount: event.target.value })} /></div>
                <div className="col-md-2"><label className="form-label">Method</label><input className="form-control" value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })} /></div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle" data-no-datatable="true">
                  <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Discount</th><th>GST %</th><th>Total</th><th /></tr></thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr data-line-total key={index}>
                        <td><select className="form-select" value={line.product_id} onChange={(event) => chooseProduct(index, event.target.value)}><option value="">Select</option>{options.products.map((product) => <option value={product.id} key={product.id}>{product.name} (Stock {product.stock_quantity})</option>)}</select></td>
                        <td><input className="form-control" type="number" min="0" value={line.quantity} onChange={(event) => setItem(index, { quantity: event.target.value })} /></td>
                        <td><input className="form-control" type="number" step="0.01" value={line.price} onChange={(event) => setItem(index, { price: event.target.value })} /></td>
                        <td><input className="form-control" type="number" step="0.01" value={line.discount} onChange={(event) => setItem(index, { discount: event.target.value })} /></td>
                        <td><input className="form-control" type="number" step="0.01" value={line.gst} onChange={(event) => setItem(index, { gst: event.target.value })} /></td>
                        <td>Rs. <span data-total-output>{line.lineTotal.toFixed(2)}</span></td>
                        <td className="text-end"><button className="btn btn-outline-danger admin-line-delete" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1} title="Delete row" aria-label="Delete row"><i className="bi bi-trash" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <strong>Grand Total: Rs. {grandTotal.toFixed(2)}</strong>
                <button className="btn btn-primary" type="button" onClick={() => setItems((current) => [...current, { ...emptyLine }])}><i className="bi bi-plus-lg" /> Add More Order</button>
              </div>
              <label className="form-label">Notes</label><textarea className="form-control" rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" type="button" onClick={onClose}>Close</button>
            <button className="btn btn-primary">Generate Invoice</button>
          </div>
        </form>
      </div>
    </div>
    <div className="modal-backdrop fade show" />
    </>
  );
}
