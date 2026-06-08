import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { AdminCreateOrderModal } from './AdminCreateOrderModal.jsx';

function Cell({ cell }) {
  if (cell && typeof cell === 'object') {
    if (cell.badge) return <span className={`badge text-bg-${cell.badgeClass || 'secondary'}`}>{cell.badge}</span>;
    if (cell.html) return <span dangerouslySetInnerHTML={{ __html: cell.html }} />;
    if (cell.link) return <a className="admin-row-link" href="#view">{cell.text}</a>;
    return cell.text ?? '-';
  }
  return cell ?? '-';
}

function FilterControl({ filter, params, updateParam }) {
  const value = params.get(filter.name) || filter.value || '';
  if (filter.type === 'select') {
    return (
      <select className="form-select" name={filter.name} value={value} onChange={(event) => updateParam(filter.name, event.target.value)}>
        {filter.options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
      </select>
    );
  }
  return <input className="form-control" type={filter.type || 'text'} name={filter.name} value={value} onChange={(event) => updateParam(filter.name, event.target.value)} />;
}

function DataTableControls({ name = 'DataTables_Table_0' }) {
  return (
    <div className="row align-items-center mb-2">
      <div className="col-sm-12 col-md-6">
        <label>
          Show{' '}
          <select className="form-select form-select-sm d-inline-block w-auto mx-1" name={`${name}_length`} defaultValue="10">
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>{' '}
          rows
        </label>
      </div>
      <div className="col-sm-12 col-md-6 text-md-end">
        <label>
          Search:
          <input className="form-control form-control-sm d-inline-block w-auto ms-2" type="search" />
        </label>
      </div>
    </div>
  );
}

function TableFooter({ count = 0 }) {
  return (
    <div className="row align-items-center mt-2">
      <div className="col-sm-12 col-md-5 text-muted small">Showing 1 to {Math.min(10, count)} of {count} entries</div>
      <div className="col-sm-12 col-md-7">
        <div className="dataTables_paginate paging_simple_numbers text-md-end">
          <span className="paginate_button previous disabled">Previous</span>
          <span className="paginate_button current mx-2">1</span>
          <span className="paginate_button next disabled">Next</span>
        </div>
      </div>
    </div>
  );
}

function PaymentActionModal({ screen, onClose }) {
  const [data, setData] = useState(null);
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    if (!screen) return;
    setData(null);
    setClientId('');
    api(`/admin/exact/${screen}`).then((result) => {
      setData(result);
      if (result.type === 'direct-payment-form') setClientId(result.clients[0]?.value ? String(result.clients[0].value) : '');
    }).catch(console.error);
  }, [screen]);

  if (!screen) return null;

  const selectedClient = data?.clients?.find((client) => String(client.value) === String(clientId));
  const clientInvoices = data?.invoices?.filter((invoice) => String(invoice.clientId) === String(clientId)) || [];

  return (
    <>
      <div className="modal fade admin-form-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <form className="modal-content" onSubmit={(event) => event.preventDefault()}>
            <div className="modal-header">
              <h2 className="modal-title h5">{data?.title || 'Payment'}</h2>
              <button className="btn-close" type="button" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              {!data ? <div className="form-panel p-4">Loading...</div> : null}
              {data?.type === 'payment-form' ? (
                <div className="form-panel p-4">
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label">{data.selectLabel}</label><select className="form-select" name={data.selectName} required>{data.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                    <div className="col-md-3"><label className="form-label">Payment Date</label><input className="form-control" type="date" name="payment_date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
                    <div className="col-md-3"><label className="form-label">Amount</label><input className="form-control" type="number" step="0.01" name="amount" required /></div>
                    <div className="col-md-3"><label className="form-label">Mode</label><select className="form-select" name="method"><option>Cash</option><option>UPI</option><option>Bank</option><option>Cheque</option></select></div>
                    <div className="col-md-3"><label className="form-label">Reference No.</label><input className="form-control" name="reference_no" /></div>
                    <div className="col-md-6"><label className="form-label">Remarks</label><input className="form-control" name="remarks" /></div>
                  </div>
                  <button className="btn btn-primary mt-4">{data.submitLabel}</button>
                </div>
              ) : null}
              {data?.type === 'direct-payment-form' ? (
                <div className="form-panel p-4">
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label">Client</label><select className="form-select" name="client_id" required value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">Select client</option>{data.clients.map((client) => <option key={client.value} value={client.value}>{client.label}</option>)}</select></div>
                    <div className="col-md-3"><label className="form-label">Payment Date</label><input className="form-control" type="date" name="payment_date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
                    <div className="col-md-3"><label className="form-label">Amount Received</label><input className="form-control" type="number" step="0.01" min="0.01" name="amount" required /></div>
                    <div className="col-md-4"><label className="form-label">Against Invoice</label><select className="form-select" name="sales_invoice_id"><option value="">Direct ledger receipt / Advance</option>{clientInvoices.map((invoice) => <option key={invoice.value} value={invoice.value}>{invoice.label}</option>)}</select></div>
                    <div className="col-md-2"><label className="form-label">Mode</label><select className="form-select" name="method"><option>Cash</option><option>UPI</option><option>Bank</option><option>Cheque</option></select></div>
                    <div className="col-md-3"><label className="form-label">Reference No.</label><input className="form-control" name="reference_no" /></div>
                    <div className="col-md-3"><label className="form-label">Current Balance</label><input className="form-control" value={selectedClient?.balance || ''} readOnly /></div>
                    <div className="col-12"><label className="form-label">Remarks</label><textarea className="form-control" name="remarks" rows="3" /></div>
                  </div>
                  <div className="d-flex gap-2 mt-4"><button className="btn btn-primary">Receive Payment</button></div>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export function AdminExactScreen({ screen }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [paymentModalScreen, setPaymentModalScreen] = useState('');
  const query = params.toString();
  const load = () => api(`/admin/exact/${screen}${query ? `?${query}` : ''}`).then(setData).catch(console.error);
  useEffect(() => { load(); }, [screen, query]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  if (!data) return <div className="table-panel p-4">Loading...</div>;

  if (data.type === 'payment-form') {
    return (
      <form className="form-panel p-4" onSubmit={(event) => event.preventDefault()}>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label">{data.selectLabel}</label><select className="form-select" name={data.selectName} required>{data.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label">Payment Date</label><input className="form-control" type="date" name="payment_date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          <div className="col-md-3"><label className="form-label">Amount</label><input className="form-control" type="number" step="0.01" name="amount" required /></div>
          <div className="col-md-3"><label className="form-label">Mode</label><select className="form-select" name="method"><option>Cash</option><option>UPI</option><option>Bank</option><option>Cheque</option></select></div>
          <div className="col-md-3"><label className="form-label">Reference No.</label><input className="form-control" name="reference_no" /></div>
          <div className="col-md-6"><label className="form-label">Remarks</label><input className="form-control" name="remarks" /></div>
        </div>
        <button className="btn btn-primary mt-4">{data.submitLabel}</button>
      </form>
    );
  }

  if (data.type === 'voucher-form') {
    return (
      <form className="form-panel p-4" onSubmit={(event) => event.preventDefault()}>
        <div className="row g-3 mb-3">
          <div className="col-md-3"><label className="form-label">Voucher Date</label><input className="form-control" type="date" name="voucher_date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          <div className="col-md-3"><label className="form-label">Voucher Type</label><select className="form-select" name="voucher_type">{data.types.map((type) => <option key={type}>{type}</option>)}</select></div>
          <div className="col-md-3"><label className="form-label">Voucher No</label><input className="form-control" name="voucher_no" placeholder="Auto if blank" /></div>
          <div className="col-md-3"><label className="form-label">Reference No</label><input className="form-control" name="reference_no" /></div>
        </div>
        {data.datatable ? <DataTableControls name="voucherRows" /> : null}
        <div className="table-responsive"><table className="table" id="voucherRows">
          <thead><tr><th>Ledger</th><th>Particulars</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>{[0, 1, 2, 3].map((index) => <tr key={index}>
            <td><select className="form-select" name="ledger_id[]"><option value="0">Select Ledger</option>{data.ledgers.map((ledger) => <option key={ledger.value} value={ledger.value}>{ledger.label}</option>)}</select></td>
            <td><input className="form-control" name="particulars[]" /></td>
            <td><input className="form-control" type="number" step="0.01" name="debit[]" defaultValue="0" /></td>
            <td><input className="form-control" type="number" step="0.01" name="credit[]" defaultValue="0" /></td>
          </tr>)}</tbody>
        </table></div>
        {data.datatable ? <TableFooter count={4} /> : null}
        <div className="col-12"><label className="form-label">Narration</label><textarea className="form-control" name="narration" rows="3" /></div>
        <div className="d-flex gap-2 mt-4"><button className="btn btn-primary">Save Voucher</button><button className="btn btn-outline-secondary" type="button">PDF</button></div>
      </form>
    );
  }

  if (data.type === 'stock') {
    return (
      <div className="row g-4">
        <div className="col-12">
          <form className="form-panel p-3" onSubmit={(event) => event.preventDefault()}>
            <h2 className="h5">Manual Stock Adjustment</h2>
            <label className="form-label">Product</label>
            <select className="form-select mb-2" name="product_id">{data.productOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <label className="form-label">Date</label><input className="form-control mb-2" type="date" name="movement_date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <label className="form-label">Type</label><select className="form-select mb-2" name="movement_type"><option value="added">Added</option><option value="returned">Return</option><option value="damaged">Damage</option><option value="adjusted">Manual adjustment</option></select>
            <label className="form-label">Quantity</label><input className="form-control mb-2" type="number" min="1" name="quantity" required />
            <label className="form-label">Note</label><input className="form-control mb-3" name="note" />
            <button className="btn btn-primary">Save Movement</button>
          </form>
        </div>
        <div className="col-12">
          <div className="table-panel p-3 mb-4">
            <h2 className="h5">Current Stock & Low Stock Alert</h2>
            <div className="table-responsive"><table className="table"><thead><tr><th>Product</th><th>Category</th><th>Current</th><th>Minimum</th><th>Status</th></tr></thead><tbody>
              {data.products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.category}</td><td>{Number(product.stock_quantity || 0)}</td><td>{Number(product.min_stock || 0)}</td><td>{Number(product.stock_quantity || 0) <= Number(product.min_stock || 0) ? <span className="badge text-bg-danger">Low Stock</span> : <span className="badge text-bg-success">OK</span>}</td></tr>)}
            </tbody></table></div>
          </div>
          <div className="table-panel p-3">
            <h2 className="h5">Stock Ledger</h2>
            <div className="table-responsive"><table className="table"><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Balance</th><th>Note</th></tr></thead><tbody>
              {data.ledger.map((entry) => <tr key={entry.id}><td>{entry.movement_date}</td><td>{entry.product_name}</td><td>{entry.movement_type}</td><td>{Number(entry.quantity || 0)}</td><td>{entry.balance_after}</td><td>{entry.note}</td></tr>)}
            </tbody></table></div>
          </div>
        </div>
      </div>
    );
  }

  if (data.type === 'split-report') {
    return (
      <>
        <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
          <form className="row g-2" onSubmit={(event) => event.preventDefault()}>
            {data.filters.map((filter) => <div className="col-auto" key={filter.name}><FilterControl filter={filter} params={params} updateParam={updateParam} /></div>)}
            <div className="col-auto"><button className="btn btn-outline-primary">Filter</button></div>
          </form>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" type="button">Excel</button>
            <button className="btn btn-outline-secondary" type="button">PDF</button>
            <button className="btn btn-primary" type="button">{data.buttons[2]}</button>
          </div>
        </div>
        <div className="row g-3 mb-4">
          {data.metrics.map(([label, value]) => <div className="col-md-4" key={label}><div className="metric-card"><p className="text-muted mb-1">{label}</p><h4>{value}</h4></div></div>)}
        </div>
        <div className="row g-4">
          <div className="col-lg-8"><div className="table-panel p-3">
            <h2 className="h5 mb-3">{data.mainTitle}</h2>
            <div className="table-responsive"><table className="table align-middle"><thead><tr>{data.mainHeaders.map((header, index) => <th key={header} className={index === data.mainHeaders.length - 1 ? 'text-end' : ''}>{header}</th>)}</tr></thead><tbody>
              {data.mainRows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index} className={index === row.length - 1 ? 'text-end' : ''}>{cell === 'View Edit' ? <><button className="btn btn-sm btn-outline-primary" type="button">View</button> <button className="btn btn-sm btn-primary" type="button">Edit</button></> : cell}</td>)}</tr>)}
            </tbody></table></div>
          </div></div>
          <div className="col-lg-4"><div className="table-panel p-3">
            <h2 className="h5 mb-3">{data.sideTitle}</h2>
            <table className="table"><tbody>{data.sideRows.map((row, rowIndex) => <tr key={rowIndex}><td>{row[0]}</td><td className="text-end">{row[1]}</td></tr>)}</tbody></table>
          </div></div>
        </div>
      </>
    );
  }

  if (data.type === 'gst-ledger') {
    return (
      <>
        <form className="row g-2 mb-3" onSubmit={(event) => event.preventDefault()}>
          {data.filters.map((filter) => <div className="col-auto" key={filter.name}><FilterControl filter={filter} params={params} updateParam={updateParam} /></div>)}
          <div className="col-auto"><button className="btn btn-primary">Apply</button></div>
          <div className="col-auto"><button className="btn btn-outline-secondary" type="button">Print</button></div>
        </form>
        <div className="row g-3 mb-4">
          {data.metrics.map(([label, value]) => <div className="col-md-3" key={label}><div className="metric-card"><p className="text-muted mb-1">{label}</p><h4>{value}</h4></div></div>)}
        </div>
        <div className="table-panel p-3">
          <div className="table-responsive"><table className="table"><thead><tr>{data.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>
            {data.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}
          </tbody></table></div>
        </div>
      </>
    );
  }

  if (data.type === 'multi-tables') {
    return (
      <>
        {data.topButtons?.length ? <div className="mb-3">{data.topButtons.map((button) => <button className={`btn btn-${button.variant || 'outline-primary'} btn-sm me-1`} type="button" key={button.label}>{button.label}</button>)}</div> : null}
        {data.filters?.length ? (
          <form className="row g-2 mb-3" onSubmit={(event) => event.preventDefault()}>
            {data.filters.map((filter) => <div className="col-auto" key={filter.name}><FilterControl filter={filter} params={params} updateParam={updateParam} /></div>)}
            <div className="col-auto"><button className="btn btn-primary">Apply</button></div>
            {data.filterButtons?.map((button) => <div className="col-auto" key={button.label}><button className={`btn btn-${button.variant || 'outline-secondary'}`} type="button">{button.label}</button></div>)}
          </form>
        ) : null}
        <div className="row g-4">
          {data.panels.map((panel) => (
            <div className={panel.columnClass || 'col-12'} key={panel.title}>
              <div className="table-panel p-3">
                <h2 className="h5">{panel.title}</h2>
                <div className="table-responsive"><table className="table"><thead><tr>{panel.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>
                  {panel.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index}><Cell cell={cell} /></td>)}</tr>)}
                </tbody></table></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  const config = data.config;
  const filters = config.filters || [];
  if (config.exportButtons) {
    return (
      <div className="table-panel p-4">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-start mb-3">
          <div>
            <h2 className="h5 mb-1">{config.panelTitle}</h2>
            {config.panelHelp ? <p className="text-muted mb-0">{config.panelHelp}</p> : null}
          </div>
          {(config.buttons || []).map((button) => <button key={button.label} className={`btn btn-${button.variant || 'primary'}`} type="button">{button.icon ? <i className={`bi ${button.icon}`} /> : null} {button.label}</button>)}
        </div>
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
          <form className="row g-2" onSubmit={(event) => event.preventDefault()}>
            {filters.map((filter) => <div className="col-auto" key={filter.name}><FilterControl filter={filter} params={params} updateParam={updateParam} /></div>)}
            <div className="col-auto"><button className="btn btn-outline-primary">Filter</button></div>
          </form>
          <div className="d-flex flex-wrap gap-2">{config.exportButtons.map((label) => <button className="btn btn-outline-secondary btn-sm" type="button" key={label}>{label}</button>)}</div>
        </div>
        <div className="table-responsive">
          {config.datatable ? <DataTableControls /> : null}
          <table className="table align-middle">
            <thead><tr>{config.headers.map((header, index) => <th key={`${header}-${index}`} className={index === config.headers.length - 1 ? 'text-end' : ''}>{header}</th>)}</tr></thead>
            <tbody>{data.rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, index) => <td key={index}><Cell cell={cell} /></td>)}
                <td className="text-end">{(row.actions || []).map((action, index) => <button key={index} className={`btn btn-sm btn-${action.variant || 'primary'}`} type="button">{action.label}</button>)}</td>
              </tr>
            ))}</tbody>
          </table>
          {config.datatable ? <TableFooter count={data.rows.length} /> : null}
        </div>
      </div>
    );
  }
  return (
    <>
      {config.topButtons?.length ? (
        <div className="d-flex gap-2 mb-3">
          {config.topButtons.map((button) => <button key={button.label} className={`btn btn-${button.variant || 'primary'}`} type="button" onClick={() => button.modalScreen ? setPaymentModalScreen(button.modalScreen) : button.to ? navigate(button.to) : null}>{button.label}</button>)}
        </div>
      ) : null}
      <div className="table-panel p-3">
        {config.panelTitle || filters.length || config.buttons?.length ? <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
          {config.panelTitle ? <div><h2 className="h5 mb-1">{config.panelTitle}</h2>{config.panelHelp ? <p className="text-muted mb-0">{config.panelHelp}</p> : null}</div> : null}
          {filters.length ? (
            <form className={filters.length > 2 ? 'row g-2' : 'd-flex gap-2'} onSubmit={(event) => event.preventDefault()}>
              {filters.map((filter) => <div className={filters.length > 2 ? 'col-auto' : ''} key={filter.name}><FilterControl filter={filter} params={params} updateParam={updateParam} /></div>)}
              <div className={filters.length > 2 ? 'col-auto' : ''}><button className="btn btn-outline-primary">Filter</button></div>
            </form>
          ) : null}
          {(config.buttons || []).map((button) => (
            <button key={button.label} className={`btn btn-${button.variant || 'primary'}`} type="button" onClick={() => button.action === 'create-order' ? setCreateOrderOpen(true) : null}>{button.icon ? <i className={`bi ${button.icon}`} /> : null} {button.label}</button>
          ))}
        </div> : null}
        {config.exportButtons ? <div className="d-flex flex-wrap gap-2 mb-3">{config.exportButtons.map((label) => <button className="btn btn-outline-secondary btn-sm" type="button" key={label}>{label}</button>)}</div> : null}
        <div className="table-responsive">
          {config.datatable ? <DataTableControls /> : null}
          <table className="table align-middle">
            <thead><tr>{config.headers.map((header, index) => <th key={`${header}-${index}`} className={index === config.headers.length - 1 ? 'text-end' : ''}>{header}</th>)}</tr></thead>
            <tbody>{data.rows.map((row) => (
              <tr key={row.id} className={row.warning ? 'table-warning' : ''}>
                {row.cells.map((cell, index) => <td key={index}><Cell cell={cell} /></td>)}
                <td className="text-end admin-actions-cell">
                  {(row.actions || []).map((action, index) => action.icon
                    ? <button key={index} className={`btn btn-sm btn-${action.variant} admin-action-btn`} type="button" title={action.title} aria-label={action.title}><i className={`bi ${action.icon}`} /></button>
                    : <button key={index} className={`btn btn-sm btn-${action.variant || 'primary'}`} type="button">{action.label}</button>)}
                </td>
              </tr>
            ))}</tbody>
          </table>
          {config.datatable ? <TableFooter count={data.rows.length} /> : null}
        </div>
      </div>
      <AdminCreateOrderModal open={createOrderOpen} onClose={() => setCreateOrderOpen(false)} onCreated={load} />
      <PaymentActionModal screen={paymentModalScreen} onClose={() => setPaymentModalScreen('')} />
    </>
  );
}
