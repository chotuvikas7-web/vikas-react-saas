import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api.js';

export function AdminProductStock() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ movement_date: new Date().toISOString().slice(0, 10), movement_type: 'added' });
  const load = () => api(`/admin/products/${id}/stock`).then(setData).catch(console.error);
  useEffect(() => { load(); }, [id]);
  const submit = async (event) => {
    event.preventDefault();
    await api(`/admin/products/${id}/stock`, { method: 'POST', body: JSON.stringify(form) });
    setForm({ movement_date: new Date().toISOString().slice(0, 10), movement_type: 'added' });
    load();
  };
  if (!data) return <div className="table-panel p-4">Loading...</div>;
  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="metric-card"><p className="text-muted mb-1">Total Stock Added</p><h4>{data.summary.added || 0}</h4></div></div>
        <div className="col-md-3"><div className="metric-card"><p className="text-muted mb-1">Stock Sold</p><h4>{data.summary.sold || 0}</h4></div></div>
        <div className="col-md-3"><div className="metric-card"><p className="text-muted mb-1">Damaged / Returned</p><h4>{data.summary.damaged || 0} / {data.summary.returned || 0}</h4></div></div>
        <div className="col-md-3"><div className="metric-card"><p className="text-muted mb-1">Remaining</p><h4>{data.product.stock_quantity}</h4></div></div>
      </div>
      <div className="row g-4">
        <div className="col-lg-4">
          <form className="form-panel p-3" onSubmit={submit}>
            <h2 className="h5">Add Movement</h2>
            <label className="form-label">Date</label><input className="form-control mb-2" type="date" value={form.movement_date} onChange={(event) => setForm({ ...form, movement_date: event.target.value })} />
            <label className="form-label">Type</label><select className="form-select mb-2" value={form.movement_type} onChange={(event) => setForm({ ...form, movement_type: event.target.value })}>{['added', 'damaged', 'returned', 'adjusted'].map((type) => <option key={type}>{type}</option>)}</select>
            <label className="form-label">Quantity</label><input className="form-control mb-2" type="number" min="1" required value={form.quantity || ''} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            <label className="form-label">Note</label><input className="form-control mb-3" value={form.note || ''} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            <button className="btn btn-primary">Save Movement</button>
          </form>
        </div>
        <div className="col-lg-8"><div className="table-panel p-3"><h2 className="h5">{data.product.name} Ledger</h2><table className="table"><thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Note</th></tr></thead><tbody>{data.ledger.map((entry) => <tr key={entry.id}><td>{entry.movement_date}</td><td>{entry.movement_type}</td><td>{entry.quantity}</td><td>{entry.note}</td></tr>)}</tbody></table></div></div>
      </div>
    </>
  );
}
