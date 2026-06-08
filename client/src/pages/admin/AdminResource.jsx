import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { DataTable } from '../../components/DataTable.jsx';
import { RecordModal } from '../../components/RecordModal.jsx';
import { adminResourceConfig } from '../../config/adminResources.js';

const words = (value) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const defaultCards = (title, rows) => [
  ['Total Records', rows.length, 'bi-collection'],
  ['Active', rows.filter((row) => String(row.status || '').toLowerCase().includes('active')).length || rows.length, 'bi-check-circle'],
  ['Pending Review', rows.filter((row) => String(row.status || '').toLowerCase().includes('pending')).length, 'bi-hourglass-split'],
  ['Updated Today', rows.filter((row) => String(row.updated_at || row.created_at || '').startsWith(new Date().toISOString().slice(0, 10))).length, 'bi-calendar-check']
].map(([label, value, icon]) => ({ label: `${title} ${label}`.replace(`${title} Total`, 'Total'), value, icon }));

export function AdminResource() {
  const { resource = 'products' } = useParams();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState({});
  const [error, setError] = useState('');
  const [modalRecord, setModalRecord] = useState(null);
  const config = adminResourceConfig[resource] || {};
  const title = config.title || resource.replaceAll('-', ' ');
  const displayTitle = words(title);
  const load = () => api(`/admin/${resource}`).then((data) => setRows(data.rows)).catch(() => setRows([]));
  useEffect(() => {
    load();
  }, [resource]);
  useEffect(() => {
    const needsCategories = config.fields?.some((field) => field.optionSource === 'categories');
    if (!needsCategories) return;
    api('/admin/categories').then((data) => setOptions((current) => ({ ...current, categories: data.rows }))).catch(() => {});
  }, [resource]);
  const visibleRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const save = async (record) => {
    try {
      setError('');
      const body = { ...record };
      const method = body.id ? 'PUT' : 'POST';
      const path = body.id ? `/admin/${resource}/${body.id}` : `/admin/${resource}`;
      delete body.id;
      await api(path, { method, body: JSON.stringify(body) });
      setModalRecord(null);
      load();
    } catch (exception) {
      setError(exception.message);
    }
  };
  const remove = async (record) => {
    if (!confirm('Delete this record?')) return;
    await api(`/admin/${resource}/${record.id}`, { method: 'DELETE' });
    load();
  };
  return (
    <>
      {error && <div className="alert">{error}</div>}
      <section className="row g-3 mb-3">
        {defaultCards(displayTitle, rows).map((card) => (
          <div className="col-md-6 col-xl-3" key={card.label}>
            <div className="metric-card p-3 h-100">
              <span className="icon"><i className={`bi ${card.icon}`} /></span>
              <p className="text-muted mb-1">{card.label}</p>
              <strong className="h4 d-block">{card.value}</strong>
            </div>
          </div>
        ))}
      </section>
      <section className="form-panel p-3 mb-3">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div><h2 className="h5 mb-1">{displayTitle}</h2><p className="text-muted mb-0">View, create, edit, delete, export and filter {displayTitle.toLowerCase()} records.</p></div>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => setModalRecord({})}><i className="bi bi-plus-circle" /> Add {displayTitle}</button>
            <button className="btn btn-outline-secondary" type="button"><i className="bi bi-funnel" /> Filters</button>
            <button className="btn btn-outline-secondary" type="button"><i className="bi bi-list-check" /> Bulk Actions</button>
            <button className="btn btn-outline-primary" onClick={() => navigator.clipboard?.writeText(JSON.stringify(visibleRows, null, 2))}><i className="bi bi-download" /> Export</button>
            <input className="form-control" placeholder="Filter without refresh" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </section>
      <section className="form-panel p-3 mb-3">
        <div className="row g-3">
          {['Search', 'Status', 'Date Range', 'Owner'].map((filter) => (
            <label className="col-md-6 col-xl-3" key={filter}>
              <span className="form-label">{filter}</span>
              <input className="form-control" placeholder={filter === 'Search' ? `Search ${displayTitle}` : filter} value={filter === 'Search' ? query : ''} onChange={filter === 'Search' ? (event) => setQuery(event.target.value) : undefined} readOnly={filter !== 'Search'} />
            </label>
          ))}
        </div>
      </section>
      <section className="table-panel p-0">
        <DataTable rows={visibleRows} columns={config.columns} onEdit={setModalRecord} onDelete={remove} />
      </section>
      <RecordModal title={displayTitle} record={modalRecord} fields={config.fields} options={options} onClose={() => setModalRecord(null)} onSubmit={save} />
    </>
  );
}
