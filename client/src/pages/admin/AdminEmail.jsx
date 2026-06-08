import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';

const folders = {
  inbox: ['Inbox', 'bi-inbox'],
  sent: ['Sent', 'bi-send'],
  drafts: ['Drafts', 'bi-envelope'],
  spam: ['Spam', 'bi-gift'],
  trash: ['Trash', 'bi-trash3'],
  archive: ['Archive', 'bi-archive']
};

export function AdminEmail({ scope = 'admin' }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ messages: [], counts: [] });
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({});
  const folder = params.get('folder') || 'inbox';
  const mail = params.get('mail') || '';
  const q = params.get('q') || '';
  const basePath = scope === 'super-admin' ? '/super-admin/email' : '/admin/email';
  const apiBase = scope === 'super-admin' ? '/super-admin/email' : '/admin/email';

  const load = () => api(`${apiBase}?folder=${folder}&mail=${mail}&q=${encodeURIComponent(q)}`).then(setData).catch(console.error);
  useEffect(() => { load(); }, [folder, mail, q]);

  const countFor = (key) => data.counts.find((row) => row.folder === key) || {};
  const badgeFor = (key) => Number(key === 'drafts' ? countFor(key).total || 0 : countFor(key).unread || 0);
  const action = async (mail_action, id = data.selected?.id) => {
    await api(apiBase, { method: 'POST', body: JSON.stringify({ mail_action, id }) });
    if (mail_action === 'trash' || mail_action === 'archive') setParams({ folder });
    else load();
  };
  const openCompose = (preset = {}) => {
    setForm(preset);
    setCompose(true);
  };
  const send = async (event, save_as = 'sent') => {
    event.preventDefault();
    await api(apiBase, { method: 'POST', body: JSON.stringify({ ...form, mail_action: 'compose', save_as }) });
    setCompose(false);
    setForm({});
    setParams({ folder: save_as === 'draft' ? 'drafts' : 'sent' });
  };

  return (
    <>
      <div className="mail-shell">
        <aside className="mail-sidebar">
          <button className="btn btn-primary mail-compose-btn" type="button" onClick={() => openCompose()}><i className="bi bi-pencil" /> Compose</button>
          <div className="mailbox-label">Mailbox</div>
          {Object.entries(folders).map(([key, [label, icon]]) => (
            <Link key={key} className={`mail-folder ${folder === key ? 'is-active' : ''}`} to={`${basePath}?folder=${key}`}>
              <span><i className={`bi ${icon}`} />{label}</span>
              {badgeFor(key) > 0 ? <strong>{badgeFor(key)}</strong> : null}
            </Link>
          ))}
        </aside>
        <section className="mail-panel">
          {data.selected ? (
            <>
              <div className="mail-toolbar">
                <Link className="mail-icon-btn" to={`${basePath}?folder=${folder}`}><i className="bi bi-arrow-left" /></Link>
                {['trash', 'read', 'archive', 'star'].map((item) => <button className="mail-icon-btn" type="button" key={item} onClick={() => action(item)}><i className={`bi ${item === 'trash' ? 'bi-trash3' : item === 'read' ? 'bi-info-circle' : item === 'archive' ? 'bi-archive' : 'bi-star'}`} /></button>)}
                <span className="mail-page-count">Message {data.selected.id}</span>
              </div>
              <article className="mail-detail">
                <div className="mail-detail-head">
                  <div><strong>{data.selected.subject}</strong><span>{data.selected.sender_name || data.selected.sender_email} to {data.selected.recipient_email || 'me'}</span></div>
                  <time>{String(data.selected.sent_at || data.selected.created_at || '').slice(0, 16)}</time>
                </div>
                <p>{data.selected.body || 'No email body.'}</p>
                <div className="mail-attachments"><strong><i className="bi bi-paperclip" /> 2 Attachments</strong><div className="mail-attachment-grid"><span><i className="bi bi-file-earmark-pdf text-danger" /><b>Guidelines.pdf</b><small>PDF - Download</small></span><span><i className="bi bi-google text-success" /><b>Branding Assets</b><small>Media - Download</small></span></div></div>
              </article>
              <div className="mail-replybar">
                <button className="btn btn-outline-secondary" onClick={() => openCompose({ recipient_email: data.selected.sender_email, subject: `Re: ${data.selected.subject}`, body: `\n\n--- Original Message ---\n${data.selected.body || ''}` })}><i className="bi bi-reply" /> Reply</button>
                <button className="btn btn-outline-secondary" onClick={() => openCompose({ recipient_email: data.selected.sender_email, subject: `Re: ${data.selected.subject}`, body: `\n\n--- Original Message ---\n${data.selected.body || ''}` })}><i className="bi bi-reply-all" /> Reply all</button>
                <button className="btn btn-outline-secondary" onClick={() => openCompose({ subject: `Fwd: ${data.selected.subject}`, body: `\n\n--- Forwarded Message ---\n${data.selected.body || ''}` })}><i className="bi bi-forward" /> Forward</button>
              </div>
            </>
          ) : (
            <>
              <div className="mail-toolbar">
                <button className="mail-icon-btn" type="button"><i className="bi bi-check2-square" /></button>
                <button className="mail-icon-btn" type="button" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
                <button className="mail-icon-btn" type="button"><i className="bi bi-trash3" /></button>
                <button className="mail-icon-btn" type="button"><i className="bi bi-archive" /></button>
                <form className="mail-search" onSubmit={(event) => event.preventDefault()}>
                  <i className="bi bi-search" /><input value={q} onChange={(event) => setParams({ folder, q: event.target.value })} placeholder="Search..." />
                </form>
              </div>
              <div className="mail-list">
                {data.messages.map((message) => (
                  <div className={`mail-row ${message.status === 'unread' ? 'is-unread' : ''}`} key={message.id}>
                    <button className="mail-star" type="button" onClick={() => action('star', message.id)}><i className={`bi ${message.is_starred ? 'bi-star-fill' : 'bi-star'}`} /></button>
                    <Link to={`${basePath}?folder=${folder}&mail=${message.id}`}>
                      <strong>{message.sender_name || message.sender_email}</strong>
                      <span>{message.subject} <em>{String(message.body || '').slice(0, 90)}</em></span>
                      {message.category ? <small>{message.category}</small> : null}
                      <time>{new Date(message.sent_at || message.created_at).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}</time>
                    </Link>
                  </div>
                ))}
                {!data.messages.length && <div className="text-center text-muted py-5">No messages in this folder.</div>}
              </div>
              <div className="mail-footer">Showing {data.messages.length} messages</div>
            </>
          )}
        </section>
      </div>
      {compose && (
        <>
        <div className="modal fade admin-form-modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form className="modal-content" onSubmit={(event) => send(event, 'sent')}>
              <div className="modal-header"><h2 className="modal-title h5">Compose Email</h2><button className="btn-close" type="button" onClick={() => setCompose(false)} /></div>
              <div className="modal-body">
                <div className="mb-3"><label className="form-label">To</label><input className="form-control" type="email" required value={form.recipient_email || ''} onChange={(event) => setForm({ ...form, recipient_email: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label">Subject</label><input className="form-control" required value={form.subject || ''} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label">Message</label><textarea className="form-control" rows="8" value={form.body || ''} onChange={(event) => setForm({ ...form, body: event.target.value })} /></div>
              </div>
              <div className="modal-footer"><button className="btn btn-outline-secondary" type="button" onClick={(event) => send(event, 'draft')}>Save Draft</button><button className="btn btn-primary">Send</button></div>
            </form>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
}
