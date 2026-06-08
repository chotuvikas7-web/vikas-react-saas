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
    if (!Number.isNaN(number)) return <>₹{number.toLocaleString('en-IN')}</>;
  }
  const text = String(value ?? '-');
  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
}

export function DataTable({ rows = [], columns: preferredColumns, onView, onEdit, onDelete }) {
  const columns = preferredColumns?.length
    ? preferredColumns
    : rows[0]
      ? Object.keys(rows[0]).filter((key) => !['metadata', 'source', 'password_hash'].includes(key)).slice(0, 8)
      : [];
  return (
    <div className="table-responsive">
      <table className="table admin-data-table align-middle">
        <thead>
          <tr>{columns.map((col) => <th key={col}>{labelize(col)}</th>)}{(onView || onEdit || onDelete) && <th className="text-end">Actions</th>}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.source || row.module_key || 'row'}-${row.id || index}-${index}`}>
              {columns.map((col) => <td data-label={labelize(col)} key={col}><CellValue column={col} value={row[col]} /></td>)}
              {(onView || onEdit || onDelete) && (
                <td className="text-end action-cell">
                  {onView && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => onView(row)}>View</button>}
                  {onEdit && <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => onEdit(row)}>Edit</button>}
                  {onDelete && <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => onDelete(row)}>Delete</button>}
                </td>
              )}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="9">No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
