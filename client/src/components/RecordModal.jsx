import { assetUrl, uploadAsset } from '../api.js';
import { defaultFields } from '../config/navigation.js';

export function RecordModal({ title, record, fields = defaultFields, options = {}, onClose, onSubmit }) {
  if (!record) return null;
  const values = record.id ? record : { status: 'active' };
  const normalizedFields = fields.map((field) => (typeof field === 'string' ? { name: field, label: field.replaceAll('_', ' ') } : field));

  return (
    <>
      <div className="modal fade admin-form-modal super-form-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <form className="modal-dialog modal-xl modal-dialog-scrollable super-form-modal-dialog" onSubmit={async (event) => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(event.currentTarget).entries());
          for (const field of normalizedFields.filter((item) => item.type === 'file')) {
            const file = data[field.name];
            if (file instanceof File && file.size > 0) {
              const upload = await uploadAsset(field.uploadFolder || 'records', file);
              data[field.name] = upload.path;
            } else {
              data[field.name] = values[field.name] || '';
            }
          }
          if (values.id) data.id = values.id;
          onSubmit(data);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <p className="super-form-modal-kicker mb-1">Full View Form</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="super-form-active">
                <div className="row">
                  {normalizedFields.map((field) => (
                    <label key={field.name} className={field.span === 2 || field.type === 'textarea' ? 'col-12' : 'col-md-6 col-xl-4'}>
                      <span className="form-label">{field.label || field.name.replaceAll('_', ' ')}</span>
                      {field.type === 'textarea'
                        ? <textarea className="form-control" name={field.name} defaultValue={values[field.name] || field.defaultValue || ''} rows="4" />
                        : field.type === 'select'
                          ? (
                            <select className="form-select" name={field.name} defaultValue={values[field.name] || field.defaultValue || field.options?.[0] || ''} required={field.required}>
                              {!field.required && <option value="">Select</option>}
                              {(field.optionSource ? options[field.optionSource] || [] : field.options || []).map((option) => {
                                const value = typeof option === 'object' ? option[field.optionValue || 'id'] : option;
                                const label = typeof option === 'object' ? option[field.optionLabel || 'name'] : option;
                                return <option key={value} value={value}>{label}</option>;
                              })}
                            </select>
                          )
                          : field.type === 'file'
                            ? (
                              <>
                                {values[field.name] && <a className="file-preview d-inline-block mb-2" href={assetUrl(values[field.name])} target="_blank" rel="noreferrer">Current file</a>}
                                <input className="form-control" name={field.name} type="file" accept="image/*" />
                              </>
                            )
                            : <input className="form-control" name={field.name} type={field.type || 'text'} step={field.step} defaultValue={values[field.name] ?? field.defaultValue ?? ''} required={field.required} />}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary">Save</button></div>
          </div>
        </form>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
