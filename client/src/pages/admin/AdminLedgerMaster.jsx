import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const natureClass = {
  asset: 'asset',
  liability: 'liability',
  income: 'income',
  expense: 'expense'
};

const ledgerAccents = ['blue', 'violet', 'orange', 'teal', 'pink', 'green'];

function titleCase(value) {
  return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
}

function balanceType(value, fallback = 'Dr') {
  return Number(value || 0) >= 0 ? fallback || 'Dr' : 'Cr';
}

function LedgerModal({ record, groups, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    id: record?.id,
    name: record?.name || '',
    group_id: record?.group_id || '',
    opening_balance: record?.opening_balance ?? '0.00',
    opening_type: record?.opening_type || 'Dr',
    contact_name: record?.contact_name || '',
    mobile: record?.mobile || '',
    email: record?.email || '',
    gst_number: record?.gst_number || '',
    gst_applicable: record?.gst_number ? 'Yes' : '',
    gst_type: record?.gst_number ? 'Registered' : '',
    notes: record?.notes || record?.address || '',
    status: record?.status || 'active'
  }));

  const selectedGroup = groups.find((group) => String(group.id) === String(form.group_id));
  const nature = titleCase(selectedGroup?.nature || record?.nature || '');
  const currentBalance = Math.abs(Number(form.opening_balance || 0));

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      address: '',
      notes: form.notes
    });
  };

  return (
    <>
      <div className="modal fade ledger-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <form className="modal-dialog modal-dialog-scrollable" onSubmit={submit}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create / Edit Ledger</h2>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="ledger-form-grid">
                <label className="ledger-field">
                  <span>Ledger Name <b>*</b></span>
                  <input className="form-control" name="name" value={form.name} onChange={update} placeholder="Enter ledger name" required />
                </label>
                <label className="ledger-field">
                  <span>Group <b>*</b></span>
                  <select className="form-select" name="group_id" value={form.group_id} onChange={update} required>
                    <option value="">Select group</option>
                    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </label>
                <label className="ledger-field">
                  <span>Nature <b>*</b></span>
                  <input className="form-control" value={nature || 'Select group first'} readOnly />
                </label>
                <label className="ledger-field">
                  <span>Contact</span>
                  <input className="form-control" name="contact_name" value={form.contact_name} onChange={update} placeholder="Select contact (optional)" />
                </label>
                <label className="ledger-field">
                  <span>Opening Balance <b>*</b></span>
                  <div className="ledger-amount-input">
                    <input name="opening_balance" type="number" step="0.01" value={form.opening_balance} onChange={update} required />
                    <select name="opening_type" value={form.opening_type} onChange={update} aria-label="Opening type">
                      <option>Dr</option>
                      <option>Cr</option>
                    </select>
                  </div>
                </label>
                <label className="ledger-field">
                  <span>Current Balance</span>
                  <div className="ledger-amount-input">
                    <input value={currentBalance.toFixed(2)} readOnly />
                    <select value={balanceType(form.opening_balance, form.opening_type)} disabled aria-label="Current type">
                      <option>Dr</option>
                      <option>Cr</option>
                    </select>
                  </div>
                </label>
                <label className="ledger-field">
                  <span>GST Applicable</span>
                  <select className="form-select" name="gst_applicable" value={form.gst_applicable} onChange={update}>
                    <option value="">Select option</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </label>
                <label className="ledger-field">
                  <span>GST Type</span>
                  <select className="form-select" name="gst_type" value={form.gst_type} onChange={update}>
                    <option value="">Select option</option>
                    <option>Registered</option>
                    <option>Unregistered</option>
                    <option>Composition</option>
                  </select>
                </label>
                <label className="ledger-field">
                  <span>GST Number</span>
                  <input className="form-control" name="gst_number" value={form.gst_number} onChange={update} placeholder="Enter GST number (optional)" />
                </label>
                <label className="ledger-field">
                  <span>Mobile</span>
                  <input className="form-control" name="mobile" value={form.mobile} onChange={update} placeholder="Enter mobile (optional)" />
                </label>
                <label className="ledger-field ledger-field-wide">
                  <span>Description</span>
                  <textarea className="form-control" name="notes" value={form.notes} onChange={update} placeholder="Enter description (optional)" rows="4" />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" name="intent" value="update">Save &amp; Update</button>
              <button className="btn btn-primary" name="intent" value="save">Save</button>
            </div>
          </div>
        </form>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export function AdminLedgerMaster() {
  const [data, setData] = useState({ rows: [], groups: [] });
  const [q, setQ] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [modalRecord, setModalRecord] = useState(null);

  const load = () => api(`/admin/ledger-master?q=${encodeURIComponent(q)}`).then(setData).catch(console.error);

  useEffect(() => {
    load();
  }, [q]);

  const visibleRows = useMemo(() => {
    const search = tableSearch.trim().toLowerCase();
    const rows = search
      ? data.rows.filter((row) => [row.name, row.group_name, row.nature, row.gst_number, row.contact_name, row.mobile].some((value) => String(value || '').toLowerCase().includes(search)))
      : data.rows;
    return rows.slice(0, pageSize);
  }, [data.rows, tableSearch, pageSize]);

  const summary = useMemo(() => {
    const opening = data.rows.reduce((sum, row) => sum + Number(row.opening_balance || 0), 0);
    const current = data.rows.reduce((sum, row) => sum + Math.abs(Number(row.opening_balance || 0)), 0);
    return {
      total: data.rows.length,
      opening,
      current,
      gst: data.rows.reduce((sum, row) => sum + Number(row.gst_amount || 0), 0)
    };
  }, [data.rows]);

  const save = async (record) => {
    const method = record.id ? 'PUT' : 'POST';
    const path = record.id ? `/admin/ledger-master/${record.id}` : '/admin/ledger-master';
    await api(path, { method, body: JSON.stringify(record) });
    setModalRecord(null);
    load();
  };

  return (
    <>
      <section className="ledger-master-page">
        <div className="ledger-master-head">
          <div className="ledger-title-wrap">
            <span className="ledger-title-icon"><i className="bi bi-journal-bookmark-fill" /></span>
            <div>
              <h1>Ledger</h1>
              <p>Manage all your ledger accounts and their balances</p>
            </div>
          </div>
          <button className="btn btn-primary ledger-create-btn" type="button" onClick={() => setModalRecord({ opening_type: 'Dr', status: 'active' })}>
            <i className="bi bi-plus-lg" /> Create Ledger
          </button>
        </div>

        <div className="ledger-toolbar">
          <label className="ledger-search-control">
            <i className="bi bi-search" />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search ledger..." aria-label="Search ledger" />
          </label>
          <button className="ledger-filter-btn" type="button"><i className="bi bi-funnel" /> Filters</button>
          <div className="ledger-table-controls">
            <label>Show</label>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Entries per page">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
            <label className="ledger-search-control ledger-search-control-sm">
              <input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="Search..." aria-label="Search table" />
              <i className="bi bi-search" />
            </label>
          </div>
        </div>

        <div className="ledger-summary-grid">
          <article className="ledger-summary-card is-blue"><span><i className="bi bi-file-earmark-text-fill" /></span><div><p>Total Ledgers</p><strong>{summary.total}</strong></div><em><i className="bi bi-people-fill" /></em></article>
          <article className="ledger-summary-card is-green"><span><i className="bi bi-wallet2" /></span><div><p>Total Balance</p><strong>{money(summary.current)}</strong></div><em><i className="bi bi-currency-dollar" /></em></article>
          <article className="ledger-summary-card is-purple"><span><i className="bi bi-graph-up-arrow" /></span><div><p>Total Opening Balance</p><strong>{money(summary.opening)}</strong></div></article>
          <article className="ledger-summary-card is-orange"><span><i className="bi bi-calculator-fill" /></span><div><p>Total GST</p><strong>{money(summary.gst)}</strong></div></article>
        </div>

        <div className="ledger-table-panel">
          <div className="table-responsive">
            <table className="table ledger-table align-middle">
              <thead>
                <tr>
                  {['#', 'Ledger Name', 'Group', 'Nature', 'Opening Balance', 'Current Balance', 'GST', 'Contact', 'Action'].map((heading) => (
                    <th key={heading}>{heading}{heading !== '#' && heading !== 'Action' ? <i className="bi bi-chevron-expand" /> : null}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((ledger, index) => {
                  const nature = String(ledger.nature || '').toLowerCase();
                  const accent = ledgerAccents[index % ledgerAccents.length];
                  const current = Math.abs(Number(ledger.opening_balance || 0));
                  return (
                    <tr key={ledger.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className={`ledger-name-cell is-${accent}`}>
                          <span><i className={`bi ${index % 3 === 0 ? 'bi-bank2' : index % 3 === 1 ? 'bi-cash-stack' : 'bi-briefcase-fill'}`} /></span>
                          <strong>{ledger.name}</strong>
                        </span>
                      </td>
                      <td>{ledger.group_name || '-'}</td>
                      <td><span className={`ledger-nature-pill is-${natureClass[nature] || 'asset'}`}>{titleCase(nature || 'asset')}</span></td>
                      <td>{money(ledger.opening_balance)} {ledger.opening_type || 'Dr'}</td>
                      <td className={current > 0 ? 'ledger-positive' : ''}>{money(current)} {balanceType(ledger.opening_balance, ledger.opening_type)}</td>
                      <td>{money(ledger.gst_amount || 0)}</td>
                      <td>{ledger.contact_name || ledger.mobile || '-'}</td>
                      <td>
                        <div className="ledger-actions">
                          <button className="btn btn-sm btn-outline-primary" type="button"><i className="bi bi-eye-fill" /> View</button>
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => setModalRecord(ledger)}><i className="bi bi-pencil" /> Edit</button>
                          <button className="ledger-more-btn" type="button" aria-label="More actions"><i className="bi bi-three-dots-vertical" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="ledger-table-footer">
            <span>Showing 1 to {visibleRows.length} of {data.rows.length} entries</span>
            <nav aria-label="Ledger pagination">
              <button type="button"><i className="bi bi-chevron-double-left" /></button>
              <button type="button"><i className="bi bi-chevron-left" /></button>
              <button className="is-active" type="button">1</button>
              <button type="button"><i className="bi bi-chevron-right" /></button>
              <button type="button"><i className="bi bi-chevron-double-right" /></button>
            </nav>
          </div>
        </div>
      </section>

      {modalRecord ? <LedgerModal record={modalRecord} groups={data.groups} onClose={() => setModalRecord(null)} onSubmit={save} /> : null}
    </>
  );
}
