import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, assetUrl, uploadAsset } from '../../api.js';
import { adminResourceConfig } from '../../config/adminResources.js';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const labels = {
  clients: 'Clients',
  suppliers: 'Suppliers',
  categories: 'Categories',
  products: 'Products'
};

const singular = {
  clients: 'Client',
  suppliers: 'Supplier',
  categories: 'Category',
  products: 'Product'
};

const columns = {
  clients: ['name', 'mobile', 'email', 'gst_number', 'pending', 'status'],
  suppliers: ['name', 'mobile', 'gst_number', 'payable', 'status'],
  categories: ['name', 'slug', 'product_count', 'status'],
  products: ['name', 'sku', 'product_code', 'hsn_code', 'unit', 'category_name', 'cost', 'price', 'gst_rate', 'stock_quantity', 'min_stock', 'status']
};

const headerLabels = {
  clients: ['Name', 'Mobile', 'Email', 'GST', 'Pending', 'Status'],
  suppliers: ['Name', 'Mobile', 'GST', 'Payable', 'Status'],
  categories: ['Name', 'Slug', 'Products', 'Status'],
  products: ['Product', 'SKU', 'Code', 'HSN', 'Unit', 'Category', 'Cost', 'Price', 'GST', 'Stock', 'Min', 'Status']
};

const actionHeader = {
  clients: '',
  products: '',
  suppliers: 'Action',
  categories: 'Action'
};

function display(row, key) {
  if (['pending', 'payable', 'cost', 'price'].includes(key)) return money(row[key]);
  if (key === 'gst_rate') return `${row[key] ?? 18}%`;
  return row[key] ?? '-';
}

export function AdminMasterScreen({ resource }) {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const q = params.get('q') || '';
  const title = labels[resource];

  const load = () => api(`/admin/${resource}`).then((data) => setRows(data.rows)).catch((exception) => setError(exception.message));
  useEffect(() => { load(); }, [resource]);

  const visibleRows = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const remove = async (row) => {
    if (!confirm(`Delete this ${singular[resource].toLowerCase()}?`)) return;
    await api(`/admin/${resource}/${row.id}`, { method: 'DELETE' });
    load();
  };
  const toggle = async (row) => {
    await api(`/admin/${resource}/${row.id}/toggle`, { method: 'POST', body: '{}' });
    load();
  };

  return (
    <>
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <div className="table-panel p-3">
        <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
          <form className="d-flex gap-2" onSubmit={(event) => event.preventDefault()}>
            <input className="form-control" value={q} placeholder={`Search ${title.toLowerCase()}`} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {})} />
            <button className="btn btn-outline-primary" type="button">Search</button>
          </form>
          <Link className="btn btn-primary" to={`/admin/${resource}/form`}>Add {singular[resource]}</Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr>{columns[resource].map((column, index) => <th key={column}>{headerLabels[resource]?.[index] || column.replaceAll('_', ' ')}</th>)}<th className="text-end">{actionHeader[resource] ?? 'Action'}</th></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  {columns[resource].map((column, index) => (
                    <td key={column}>
                      {column === 'status'
                        ? <span className={`badge text-bg-${row.status === 'active' ? 'success' : 'secondary'}`}>{row.status}</span>
                        : index === 0 && ['clients', 'suppliers'].includes(resource) ? <Link to={`/admin/${resource}/profile/${row.id}`}>{display(row, column)}</Link> : display(row, column)}
                    </td>
                  ))}
                  <td className="text-end admin-actions-cell">
                    <Link className="btn btn-sm btn-outline-primary admin-action-btn" title={`Edit ${singular[resource].toLowerCase()}`} aria-label={`Edit ${singular[resource].toLowerCase()}`} to={`/admin/${resource}/form?id=${row.id}`}><i className="bi bi-pencil-square" /></Link>
                    {resource === 'products' ? <Link className="btn btn-sm btn-outline-secondary admin-action-btn" to={`/admin/products/stock/${row.id}`}><i className="bi bi-box-seam" /></Link> : null}
                    <button className="btn btn-sm btn-outline-secondary admin-action-btn" title="Toggle status" onClick={() => toggle(row)}><i className="bi bi-arrow-repeat" /></button>
                    <button className="btn btn-sm btn-outline-danger admin-action-btn" title="Delete" onClick={() => remove(row)}><i className="bi bi-trash3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function AdminMasterForm({ resource }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get('id');
  const [record, setRecord] = useState(null);
  const [options, setOptions] = useState({});
  const [error, setError] = useState('');
  const config = adminResourceConfig[resource] || {};
  const title = `${singular[resource]} Form`;

  useEffect(() => {
    setError('');
    if (id) api(`/admin/${resource}/${id}`).then((data) => setRecord(data.row)).catch((exception) => setError(exception.message));
    else setRecord({ status: 'active' });
  }, [resource, id]);

  useEffect(() => {
    if (resource === 'products') api('/admin/categories').then((data) => setOptions({ categories: data.rows })).catch(() => {});
  }, [resource]);

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    for (const field of (config.fields || []).filter((item) => item.type === 'file')) {
      const file = data[field.name];
      if (file instanceof File && file.size > 0) {
        const upload = await uploadAsset(field.uploadFolder || resource, file);
        data[field.name] = upload.path;
      } else {
        data[field.name] = record?.[field.name] || '';
      }
    }
    const method = id ? 'PUT' : 'POST';
    const path = id ? `/admin/${resource}/${id}` : `/admin/${resource}`;
    await api(path, { method, body: JSON.stringify(data) });
    navigate(`/admin/${resource}`);
  };

  if (!record) return <div className="form-panel p-4">Loading...</div>;
  return (
    <>
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <form method="post" encType="multipart/form-data" className="form-panel p-4" onSubmit={submit}>
        <div className="row g-3">
          {(config.fields || []).map((field) => (
            <label key={field.name} className={field.span === 2 || field.type === 'textarea' ? 'col-12' : resource === 'categories' ? field.name === 'status' ? 'col-md-2' : 'col-md-5' : field.name === 'main_image' || field.name === 'photo' ? 'col-md-6' : 'col-md-6'}>
              <span className="form-label">{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea className="form-control" name={field.name} rows={field.name === 'description' || field.name === 'specifications' ? 4 : 3} defaultValue={record[field.name] || ''} />
              ) : field.type === 'select' ? (
                <select className="form-select" name={field.name} defaultValue={record[field.name] || field.defaultValue || field.options?.[0] || ''} required={field.required}>
                  {(field.optionSource ? options[field.optionSource] || [] : field.options || []).map((option) => {
                    const value = typeof option === 'object' ? option[field.optionValue || 'id'] : option;
                    const label = typeof option === 'object' ? option[field.optionLabel || 'name'] : option;
                    return <option key={value} value={value}>{typeof label === 'string' ? label.replace(/^\w/, (char) => char.toUpperCase()) : label}</option>;
                  })}
                </select>
              ) : field.type === 'file' ? (
                <>
                  {record[field.name] ? <a className="file-preview d-inline-block mb-2" href={assetUrl(record[field.name])} target="_blank" rel="noreferrer">Current file</a> : null}
                  <input className="form-control" type="file" name={field.name} accept="image/*" />
                </>
              ) : (
                <input className="form-control" name={field.name} type={field.type || 'text'} step={field.step} defaultValue={record[field.name] ?? field.defaultValue ?? ''} required={field.required} />
              )}
            </label>
          ))}
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-primary">Save {singular[resource]}</button>
          <Link className="btn btn-outline-secondary" to={`/admin/${resource}`}>Cancel</Link>
        </div>
      </form>
    </>
  );
}

export function AdminProfile({ type }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api(`/admin/${type}/${id}/profile`).then(setData).catch(console.error); }, [type, id]);
  if (!data) return <div className="table-panel p-4">Loading...</div>;
  const person = data.client || data.supplier;
  const isClient = type === 'clients';
  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="form-panel p-4">
          {person.photo ? <img className="img-fluid rounded mb-3" src={assetUrl(person.photo)} alt={person.name} /> : null}
          <h2 className="h4">{person.name}</h2>
          <p className="mb-1"><strong>Mobile:</strong> {person.mobile}</p>
          <p className="mb-1"><strong>Email:</strong> {person.email}</p>
          <p className="mb-1"><strong>GST:</strong> {person.gst_number}</p>
          <p className="text-muted">{person.address}</p>
          <Link className="btn btn-outline-primary btn-sm admin-action-btn" title="Edit profile" aria-label="Edit profile" to={`/admin/${type}/form?id=${person.id}`}><i className="bi bi-pencil-square" /></Link>
          {isClient ? <button className="btn btn-primary btn-sm ms-2"><i className="bi bi-cash-coin" /> Receive Payment</button> : null}
        </div>
        <div className="row g-3 mt-1">
          <div className="col-6"><div className="metric-card"><p className="text-muted mb-1">{isClient ? 'Pending' : 'Pending Payable'}</p><h5>{money(isClient ? Number(data.summary?.total || 0) - Number(data.summary?.paid || 0) : data.payable)}</h5></div></div>
          <div className="col-6"><div className="metric-card"><p className="text-muted mb-1">{isClient ? 'Completed' : 'Purchases'}</p><h5>{money(isClient ? data.summary?.paid : data.purchases?.reduce((sum, row) => sum + Number(row.grand_total || 0), 0))}</h5></div></div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="table-panel p-3 mb-4">
          <h3 className="h5">{isClient ? 'Invoice History' : 'Purchase History'}</h3>
          <div className="table-responsive">
            <table className="table">
              {isClient ? (
                <>
                  <thead><tr><th>Invoice</th><th>Type</th><th>Date</th><th>Total</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Status</th></tr></thead>
                  <tbody>{data.invoices.map((row) => <tr key={`${row.invoice_type}-${row.id}`}><td>{row.invoice_no}</td><td>{row.invoice_type === 'sales' ? 'Sales Invoice' : 'Website Order'}</td><td>{row.invoice_date}</td><td>{money(row.grand_total)}</td><td>{money(row.grand_total)}</td><td>{money(row.paid_amount)}</td><td>{money(row.due_amount)}</td><td><span className={`badge text-bg-${['Paid', 'Completed'].includes(row.payment_status) ? 'success' : row.payment_status === 'Partial' ? 'warning' : 'danger'}`}>{row.payment_status}</span></td></tr>)}</tbody>
                </>
              ) : (
                <>
                  <thead><tr><th>Bill</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>{data.purchases.map((row) => <tr key={`${row.bill_no}-${row.id}`}><td>{row.bill_no}</td><td>{row.purchase_date}</td><td>{money(row.grand_total)}</td><td>{row.payment_status}</td></tr>)}</tbody>
                </>
              )}
            </table>
          </div>
        </div>
        <div className="table-panel p-3">
          <h3 className="h5">{isClient ? 'Ledger / Account History' : 'Supplier Ledger'}</h3>
          <div className="table-responsive">
            <table className="table">
              {isClient ? (
                <>
                  <thead><tr><th>Date</th><th>Particulars</th><th>Voucher Number</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                  <tbody>{data.ledgerRows.map((entry) => {
                    const balance = entry.display_balance ?? entry.running_balance ?? entry.amount ?? 0;
                    return <tr key={entry.id}><td>{entry.transaction_date}</td><td>{entry.description}</td><td>{entry.reference_no || ''}</td><td>{entry.type}</td><td>{money(entry.display_debit ?? entry.debit ?? (entry.type === 'debit' ? entry.amount : 0))}</td><td>{money(entry.display_credit ?? entry.credit ?? (entry.type === 'credit' ? entry.amount : 0))}</td><td>{money(Math.abs(balance))} {balance >= 0 ? 'Dr' : 'Cr'}</td></tr>;
                  })}</tbody>
                </>
              ) : (
                <>
                  <thead><tr><th>Date</th><th>Ref</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                  <tbody>{data.ledgerRows.map((entry) => <tr key={entry.id}><td>{entry.transaction_date}</td><td>{entry.reference_no}</td><td>{entry.description}</td><td>{money(entry.debit)}</td><td>{money(entry.credit)}</td><td>{money(entry.running_balance)}</td></tr>)}</tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
