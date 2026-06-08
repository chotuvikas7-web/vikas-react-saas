import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { RecordModal } from '../../components/RecordModal.jsx';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AdminLedgerMaster() {
  const [data, setData] = useState({ rows: [], groups: [] });
  const [q, setQ] = useState('');
  const [modalRecord, setModalRecord] = useState(null);
  const load = () => api(`/admin/ledger-master?q=${encodeURIComponent(q)}`).then(setData).catch(console.error);
  useEffect(() => { load(); }, [q]);
  const fields = [
    { name: 'name', label: 'Ledger Name', required: true },
    { name: 'group_id', label: 'Ledger Group', type: 'select', optionSource: 'groups', optionLabel: 'name', optionValue: 'id', required: true },
    { name: 'opening_balance', label: 'Opening Balance', type: 'number', step: '0.01' },
    { name: 'opening_type', label: 'Opening Type', type: 'select', options: ['Dr', 'Cr'] },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { name: 'gst_number', label: 'GST Number' },
    { name: 'contact_name', label: 'Contact Name' },
    { name: 'mobile', label: 'Mobile' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' }
  ];
  const save = async (record) => {
    const method = record.id ? 'PUT' : 'POST';
    const path = record.id ? `/admin/ledger-master/${record.id}` : '/admin/ledger-master';
    await api(path, { method, body: JSON.stringify(record) });
    setModalRecord(null);
    load();
  };
  return (
    <>
      <div className="table-panel p-3">
        <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
          <form className="d-flex gap-2" onSubmit={(event) => event.preventDefault()}><input className="form-control" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search ledger" /><button className="btn btn-outline-primary" type="button">Search</button></form>
          <button className="btn btn-primary" onClick={() => setModalRecord({ opening_type: 'Dr', status: 'active' })}>Create Ledger</button>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Ledger</th><th>Group</th><th>Nature</th><th>Opening</th><th>Current Balance</th><th>GST</th><th>Contact</th><th className="text-end">Action</th></tr></thead>
            <tbody>{data.rows.map((ledger) => <tr key={ledger.id}><td>{ledger.name}</td><td>{ledger.group_name}</td><td>{String(ledger.nature || '').replace(/\b\w/, (char) => char.toUpperCase())}</td><td>{money(ledger.opening_balance)} {ledger.opening_type}</td><td>{money(Math.abs(Number(ledger.opening_balance || 0)))} {Number(ledger.opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}</td><td>{ledger.gst_number}</td><td>{`${ledger.contact_name || ''} ${ledger.mobile || ''}`}</td><td className="text-end"><button className="btn btn-sm btn-outline-primary">Statement</button> <button className="btn btn-sm btn-primary" onClick={() => setModalRecord(ledger)}>Edit</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <RecordModal title="Ledger Form" record={modalRecord} fields={fields} options={{ groups: data.groups }} onClose={() => setModalRecord(null)} onSubmit={save} />
    </>
  );
}
