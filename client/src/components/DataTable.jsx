import { useEffect, useMemo, useState } from 'react';

const statusTone = (value) => {
  const status = String(value || '').toLowerCase();
  if (['active', 'paid', 'success', 'approved', 'resolved'].includes(status)) return 'success';
  if (['trial', 'pending', 'queued', 'running', 'review', 'testing'].includes(status)) return 'warning';
  if (['suspended', 'rejected', 'failed', 'blocked', 'cancelled', 'expired', 'inactive'].includes(status)) return 'danger';
  return 'secondary';
};

const labelize = (value) => String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

function CellValue({ column, value }) {
  const isStatus = column.toLowerCase().includes('status') || column.toLowerCase() === 'priority';
  if (isStatus) return <span className={`badge text-bg-${statusTone(value)}`}>{String(value || '-')}</span>;
  if (column.toLowerCase().includes('amount') && value !== null && value !== undefined && value !== '-') {
    const number = Number(value);
    if (!Number.isNaN(number)) return <>Rs. {number.toLocaleString('en-IN')}</>;
  }
  const text = String(value ?? '-');
  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}

export function DataTable({ rows = [], columns: preferredColumns, onView, onEdit, onDelete, searchable = true }) {
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const hasActions = Boolean(onView || onEdit || onDelete);
  const columns = preferredColumns?.length
    ? preferredColumns
    : rows[0]
      ? Object.keys(rows[0]).filter((key) => !['metadata', 'source', 'password_hash'].includes(key)).slice(0, 8)
      : [];

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;
    return rows.filter((row) => columns.some((column) => String(row[column] ?? '').toLowerCase().includes(value)));
  }, [columns, query, rows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = filteredRows.length ? (currentPage - 1) * pageSize : 0;
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize, rows.length]);

  return (
    <>
      <div className="app-table-toolbar">
        <div className="app-table-length">
          <span>Show</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Entries per page">
            {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <span>entries</span>
        </div>
        {searchable ? (
          <label className="app-table-search">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." aria-label="Search table" />
            <i className="bi bi-search" />
          </label>
        ) : null}
      </div>
      <div className="table-responsive app-table-responsive">
        <table className="table admin-data-table align-middle">
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{labelize(col)}<i className="bi bi-chevron-expand" /></th>)}
              {hasActions ? <th className="text-end">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={`${row.source || row.module_key || 'row'}-${row.id || index}-${index}`}>
                {columns.map((col) => <td data-label={labelize(col)} key={col}><CellValue column={col} value={row[col]} /></td>)}
                {hasActions ? (
                  <td className="text-end action-cell">
                    {onView ? <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => onView(row)}><i className="bi bi-eye" /> View</button> : null}
                    {onEdit ? <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => onEdit(row)}><i className="bi bi-pencil" /> Edit</button> : null}
                    {onDelete ? <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => onDelete(row)}><i className="bi bi-trash3" /> Delete</button> : null}
                  </td>
                ) : null}
              </tr>
            ))}
            {!filteredRows.length ? <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className="text-center text-muted py-4">No records yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="app-table-footer">
        <span>Showing {filteredRows.length ? startIndex + 1 : 0} to {startIndex + visibleRows.length} of {filteredRows.length} entries</span>
        <nav aria-label="Table pagination">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(1)}><i className="bi bi-chevron-double-left" /></button>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><i className="bi bi-chevron-left" /></button>
          <button className="is-active" type="button">{currentPage}</button>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><i className="bi bi-chevron-right" /></button>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><i className="bi bi-chevron-double-right" /></button>
        </nav>
      </div>
    </>
  );
}
