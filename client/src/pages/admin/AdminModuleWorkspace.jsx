import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { DataTable } from '../../components/DataTable.jsx';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusOptions = ['active', 'pending', 'approved', 'completed', 'rejected', 'inactive'];
const words = (value) => String(value || '').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function AdminModuleWorkspace({ moduleKey }) {
  const { resource } = useParams();
  const module = moduleKey || resource;
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ rows: [], counts: [], config: {} });
  const [modalRecord, setModalRecord] = useState(null);
  const q = params.get('q') || '';
  const status = params.get('status') || '';
  const load = () => api(`/admin/modules/${module}?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`).then(setData).catch(console.error);
  useEffect(() => { load(); }, [module, q, status]);
  const config = data.config || {};
  const totalAmount = useMemo(() => data.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0), [data.rows]);
  const count = (key) => data.counts.find((row) => row.status === key)?.total || 0;
  const pageTitle = config.title || words(module);
  const titleLabel = config.titleLabel || `${pageTitle} Title`;
  const referenceLabel = config.referenceLabel || 'Reference No.';
  const partyLabel = config.partyLabel || 'Party / Owner';
  const amountLabel = config.amountLabel || 'Amount';
  const save = async (record) => {
    const method = record.id ? 'PUT' : 'POST';
    const path = record.id ? `/admin/modules/${module}/${record.id}` : `/admin/modules/${module}`;
    await api(path, { method, body: JSON.stringify(record) });
    setModalRecord(null);
    load();
  };
  const remove = async (row) => {
    if (!confirm('Delete this entry?')) return;
    await api(`/admin/modules/${module}/${row.id}`, { method: 'DELETE' });
    load();
  };
  const submit = async (event) => {
    event.preventDefault();
    const record = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (modalRecord?.id) record.id = modalRecord.id;
    await save(record);
  };
  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-xl-3 col-md-6"><div className="stat-card"><div><span>Total Entries</span><strong>{data.rows.length}</strong></div><i className="bi bi-grid" /></div></div>
        <div className="col-xl-3 col-md-6"><div className="stat-card"><div><span>Active</span><strong>{count('active')}</strong></div><i className="bi bi-check-circle" /></div></div>
        <div className="col-xl-3 col-md-6"><div className="stat-card"><div><span>Pending</span><strong>{count('pending')}</strong></div><i className="bi bi-hourglass-split" /></div></div>
        <div className="col-xl-3 col-md-6"><div className="stat-card"><div><span>Total Value</span><strong>{money(totalAmount)}</strong></div><i className="bi bi-currency-rupee" /></div></div>
      </div>
      <div className="table-panel p-4 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div className="d-flex align-items-center gap-3"><div className="icon"><i className="bi bi-grid" /></div><div><h2 className="h5 mb-1">{pageTitle} Workspace</h2><p className="text-muted mb-0">Module key: <strong>{module}</strong>. Add, filter, edit and track this ERP module.</p></div></div>
          <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary btn-sm" onClick={() => setModalRecord({})}><i className="bi bi-plus-lg" /> Add {pageTitle}</button><button className="btn btn-outline-secondary btn-sm">Bulk Actions</button><button className="btn btn-outline-secondary btn-sm">Export CSV</button><button className="btn btn-outline-secondary btn-sm">Export Excel</button><button className="btn btn-outline-secondary btn-sm">Export PDF</button></div>
        </div>
        <form className="row g-2" onSubmit={(event) => event.preventDefault()}>
          <div className="col-lg-5"><input className="form-control" value={q} onChange={(event) => setParams(Object.fromEntries(Object.entries({ q: event.target.value, status }).filter(([, value]) => value)))} placeholder={`Search ${pageTitle}`} /></div>
          <div className="col-lg-3"><select className="form-select" value={status} onChange={(event) => setParams(Object.fromEntries(Object.entries({ q, status: event.target.value }).filter(([, value]) => value)))}><option value="">All Status</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
          <div className="col-lg-2"><button className="btn btn-primary w-100">Filter</button></div>
          <div className="col-lg-2"><button className="btn btn-outline-secondary w-100" type="button" onClick={() => setParams({})}>Reset</button></div>
        </form>
      </div>
      {modalRecord && (
        <>
          <div className="modal fade admin-form-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <form className="modal-content admin-three-column-form" onSubmit={submit}>
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title h5">{modalRecord.id ? 'Edit' : 'Add'} {pageTitle}</h2>
                    <p className="text-muted mb-0">Fill details and save this {pageTitle.toLowerCase()} record.</p>
                  </div>
                  <button className="btn-close" type="button" onClick={() => setModalRecord(null)} aria-label="Close" />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-lg-4 col-md-6"><label className="form-label">{titleLabel}</label><input className="form-control" name="title" defaultValue={modalRecord.title || ''} required /></div>
                    <div className="col-lg-4 col-md-6"><label className="form-label">{referenceLabel}</label><input className="form-control" name="reference_no" defaultValue={modalRecord.reference_no || ''} /></div>
                    <div className="col-lg-4 col-md-6"><label className="form-label">{partyLabel}</label><input className="form-control" name="party_name" defaultValue={modalRecord.party_name || ''} /></div>
                    <div className="col-lg-4 col-md-6"><label className="form-label">{amountLabel}</label><input className="form-control" type="number" step="0.01" name="amount" defaultValue={modalRecord.amount ?? ''} /></div>
                    <div className="col-lg-4 col-md-6"><label className="form-label">Due Date</label><input className="form-control" type="date" name="due_date" defaultValue={modalRecord.due_date || ''} /></div>
                    <div className="col-lg-4 col-md-6"><label className="form-label">Status</label><select className="form-select" name="status" defaultValue={modalRecord.status || 'active'}>{statusOptions.map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select></div>
                    <div className="col-12"><label className="form-label">Notes</label><textarea className="form-control" name="description" rows="3" defaultValue={modalRecord.description || ''} /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  {modalRecord.id ? <button className="btn btn-outline-secondary" type="button" onClick={() => setModalRecord(null)}>Cancel Edit</button> : null}
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setModalRecord(null)}>Close</button>
                  <button className="btn btn-primary">{modalRecord.id ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
      <div className="table-panel p-4">
        <DataTable
          rows={data.rows}
          columns={['title', 'reference_no', 'party_name', 'amount', 'status', 'due_date']}
          onView={(row) => alert(row.description || 'No notes added yet.')}
          onEdit={setModalRecord}
          onDelete={remove}
        />
      </div>
    </>
  );
}
