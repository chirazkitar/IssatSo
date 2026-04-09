import { useEffect, useRef, useState } from 'react';
import { messagesAPI, getToken, API_BASE } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/ui/Avatar';
import Icon from '../../components/icons';
import Loader from '../../components/ui/Loader';
import Spinner from '../../components/ui/Spinner';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(dateStr).toLocaleDateString('fr-DZ');
}

const ROLE_LABELS = {
  student: 'Étudiant', teacher: 'Enseignant',
  admin: 'Administrateur', chef_departement: 'Chef Dép.',
};

function scopeLabel(scope, recipientFirst, recipientLast, programName) {
  if (scope === 'broadcast') return 'Annonce globale';
  if (scope === 'class')     return programName || 'Classe';
  return `${recipientFirst || ''} ${recipientLast || ''}`.trim() || '—';
}
function scopeIcon(scope) {
  if (scope === 'broadcast') return 'megaphone';
  if (scope === 'class')     return 'people';
  return 'envelope';
}

/* ── Téléchargement authentifié ─────────────────────────────────────────────── */
async function downloadAttachment(id, filename) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/messages/attachment/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── SVG inline icons ────────────────────────────────────────────────────────── */
const AttachIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const FileIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const XIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const DownloadIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ── Compose Panel ───────────────────────────────────────────────────────────── */
function ComposePanel({ user, onCancel, onSent }) {
  const toast = useToast();
  const [recipients, setRecipients] = useState({ users: [], programs: [] });
  const [loadingR, setLoadingR]     = useState(true);
  const [sending,  setSending]      = useState(false);
  const [search,   setSearch]       = useState('');
  const [files,    setFiles]        = useState([]);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    scope: 'direct', recipient_id: '', program_id: '', subject: '', body: '',
  });

  useEffect(() => {
    messagesAPI.recipients()
      .then(setRecipients)
      .catch(() => toast('Erreur destinataires', 'error'))
      .finally(() => setLoadingR(false));
  }, []);

  const canBroadcast = user.role === 'admin';
  const canClass     = ['admin', 'teacher', 'chef_departement'].includes(user.role);

  const filteredUsers = recipients.users.filter(u =>
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = {};
  filteredUsers.forEach(u => {
    const g = ROLE_LABELS[u.role] || u.role;
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(u);
  });

  function handleFileChange(e) {
    const picked = Array.from(e.target.files);
    setFiles(prev => [...prev, ...picked].slice(0, 5));
    e.target.value = '';
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if (!form.subject.trim() || !form.body.trim()) { toast('Sujet et message requis', 'error'); return; }
    if (form.scope === 'direct' && !form.recipient_id) { toast('Choisissez un destinataire', 'error'); return; }
    if (form.scope === 'class'  && !form.program_id)   { toast('Choisissez une filière', 'error'); return; }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('body', form.body);
      fd.append('scope', form.scope);
      if (form.scope === 'direct') fd.append('recipient_id', form.recipient_id);
      if (form.scope === 'class')  fd.append('program_id',   form.program_id);
      files.forEach(f => fd.append('attachments', f));

      await messagesAPI.send(fd);
      toast('Message envoyé !', 'success');
      onSent();
    } catch (e) {
      toast(e.message || 'Erreur envoi', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="compose-panel">
      <div className="compose-header">
        <span style={{ fontWeight: 700, fontSize: 14 }}>Nouveau message</span>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          <Icon name="x" size={14} />
        </button>
      </div>

      {loadingR ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader />
        </div>
      ) : (
        <div className="compose-form">

          {/* Scope */}
          <div className="compose-field">
            <label>Type d'envoi</label>
            <div className="compose-scope">
              {[
                { v: 'direct',    label: 'Direct',  icon: 'envelope'  },
                ...(canClass     ? [{ v: 'class',     label: 'Classe',  icon: 'people'   }] : []),
                ...(canBroadcast ? [{ v: 'broadcast', label: 'Annonce', icon: 'megaphone' }] : []),
              ].map(opt => (
                <button key={opt.v}
                  className={`btn btn-sm ${form.scope === opt.v ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setForm(f => ({ ...f, scope: opt.v, recipient_id: '', program_id: '' }))}>
                  <Icon name={opt.icon} size={12} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.scope === 'broadcast' && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '10px 12px', fontSize: 12,
              color: 'var(--red,#ef4444)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="megaphone" size={13} />
              Ce message sera visible par TOUS les utilisateurs.
            </div>
          )}

          {form.scope === 'direct' && (
            <div className="compose-field">
              <label>Destinataire</label>
              <input className="input" placeholder="Rechercher…" value={search}
                onChange={e => setSearch(e.target.value)} style={{ marginBottom: 6 }} />
              <div className="contact-picker">
                {Object.entries(grouped).map(([group, users]) => (
                  <div key={group}>
                    <div className="contact-group-label">{group}</div>
                    {users.map(u => (
                      <div key={u.id}
                        className={`contact-item ${form.recipient_id == u.id ? 'contact-item-selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, recipient_id: u.id }))}>
                        <Avatar firstName={u.first_name} lastName={u.last_name} size="xs" />
                        <span style={{ fontSize: 12 }}>{u.first_name} {u.last_name}</span>
                        {form.recipient_id == u.id && (
                          <Icon name="checkCircle" size={13} style={{ marginLeft: 'auto', color: 'var(--accent2)' }} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
                    Aucun résultat
                  </div>
                )}
              </div>
            </div>
          )}

          {form.scope === 'class' && (
            <div className="compose-field">
              <label>Filière</label>
              <div className="contact-picker">
                {recipients.programs.map(p => (
                  <div key={p.id}
                    className={`contact-item ${form.program_id == p.id ? 'contact-item-selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, program_id: p.id }))}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(79,99,240,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="people" size={13} style={{ color: 'var(--accent2)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{p.code}</div>
                    </div>
                    {form.program_id == p.id && (
                      <Icon name="checkCircle" size={13} style={{ marginLeft: 'auto', color: 'var(--accent2)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="compose-field">
            <label>Objet</label>
            <input className="input" placeholder="Objet du message…"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>

          <div className="compose-field" style={{ flex: 1 }}>
            <label>Message</label>
            <textarea className="input" style={{ flex: 1, minHeight: 120, resize: 'vertical' }}
              placeholder="Votre message…"
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>

          {/* Pièces jointes */}
          <div className="compose-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Pièces jointes
              <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 11 }}>
                (max 5 fichiers · 10 Mo chacun)
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 5}
            >
              <AttachIcon />
              Joindre un fichier
            </button>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '5px 10px', fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--accent2)', display: 'flex', flexShrink: 0 }}>
                      <FileIcon size={13} />
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <span style={{ color: 'var(--text3)', flexShrink: 0, fontSize: 11 }}>
                      {(f.size / 1024).toFixed(0)} Ko
                    </span>
                    <button
                      type="button"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 2, display: 'flex', color: 'var(--text3)', borderRadius: 4,
                      }}
                      onClick={() => removeFile(i)}
                    >
                      <XIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="compose-actions">
            <button className="btn btn-ghost btn-sm" onClick={onCancel}>Annuler</button>
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {sending ? <Spinner size={12} /> : <Icon name="envelope" size={12} />}
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Thread View ─────────────────────────────────────────────────────────────── */
function ThreadView({ msg, onBack }) {
  const { refresh } = useMessaging();
  useEffect(() => {
    if (msg.unread) messagesAPI.markRead(msg.id).then(refresh).catch(() => {});
  }, [msg.id]);

  return (
    <div className="thread-view">
      <div className="thread-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="arrowLeft" size={13} /> Retour
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="thread-subject">{msg.subject}</div>
          <div className="thread-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name={scopeIcon(msg.scope)} size={11} />
              {msg.scope === 'broadcast' ? 'Annonce globale' : msg.scope === 'class' ? 'Classe' : 'Direct'}
            </span>
            <span className="thread-dot" />
            <span>{timeAgo(msg.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="thread-sender-row">
        <Avatar firstName={msg.sender_first} lastName={msg.sender_last} size="sm" />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{msg.sender_first} {msg.sender_last}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {ROLE_LABELS[msg.sender_role] || msg.sender_role}
          </div>
        </div>
      </div>

      <div className="thread-body" style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>

      {/* Pièces jointes */}
      {msg.attachments?.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AttachIcon />
            Pièces jointes ({msg.attachments.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.attachments.map(att => (
              <button
                key={att.id}
                onClick={() => downloadAttachment(att.id, att.filename)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px',
                  cursor: 'pointer', color: 'inherit', width: '100%',
                  textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
              >
                <span style={{ color: 'var(--accent2)', display: 'flex', flexShrink: 0 }}>
                  <FileIcon size={14} />
                </span>
                <span style={{
                  flex: 1, fontSize: 12,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {att.filename}
                </span>
                {att.size_bytes > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                    {(att.size_bytes / 1024).toFixed(0)} Ko
                  </span>
                )}
                <span style={{ color: 'var(--text3)', display: 'flex', flexShrink: 0 }}>
                  <DownloadIcon size={13} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────────── */
export default function MessagingPage() {
  const { user }           = useAuth();
  const { inbox, refresh } = useMessaging();
  const toast              = useToast();
  const [tab,      setTab]      = useState('inbox');
  const [sent,     setSent]     = useState([]);
  const [sentLoad, setSentLoad] = useState(false);
  const [selected, setSelected] = useState(null);
  const [view,     setView]     = useState('list'); // 'list' | 'thread' | 'compose'

  useEffect(() => {
    if (tab === 'sent') {
      setSentLoad(true);
      messagesAPI.sent()
        .then(setSent)
        .catch(() => toast('Erreur chargement envoyés', 'error'))
        .finally(() => setSentLoad(false));
    }
  }, [tab]);

  function openMessage(msg) { setSelected(msg); setView('thread'); }
  function openCompose()    { setSelected(null); setView('compose'); }
  function handleSent() {
    refresh();
    setView('list');
    if (tab === 'sent') {
      setSentLoad(true);
      messagesAPI.sent().then(setSent).finally(() => setSentLoad(false));
    }
  }

  const list        = tab === 'inbox' ? inbox : sent;
  const unreadCount = inbox.filter(m => m.unread).length;

  return (
    <div className="messaging-page">
      <div className="messaging-layout">

        {/* LEFT — liste */}
        <div className="msg-list-panel">
          <div className="msg-list-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Messagerie</span>
              <button className="btn btn-primary btn-sm" onClick={openCompose}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="pencil" size={12} /> Rédiger
              </button>
            </div>
            <div className="msg-tabs">
              {[
                { key: 'inbox', label: 'Reçus',   icon: 'inbox'    },
                { key: 'sent',  label: 'Envoyés', icon: 'envelope' },
              ].map(t => (
                <button key={t.key}
                  className={`msg-tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => { setTab(t.key); setSelected(null); setView('list'); }}>
                  <Icon name={t.icon} size={12} /> {t.label}
                  {t.key === 'inbox' && unreadCount > 0 && (
                    <span className="msg-tab-badge">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="msg-list-body">
            {(tab === 'sent' && sentLoad) ? (
              <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
                <Loader />
              </div>
            ) : list.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                <Icon name="envelope" size={28} style={{ marginBottom: 8 }} />
                <p>{tab === 'inbox' ? 'Aucun message reçu' : 'Aucun message envoyé'}</p>
              </div>
            ) : list.map(msg => {
              const isInbox  = tab === 'inbox';
              const isUnread = isInbox && msg.unread;
              const isActive = selected?.id === msg.id;
              const hasAtt   = msg.attachments?.length > 0;
              return (
                <div key={msg.id}
                  className={`msg-row ${isActive ? 'msg-row-active' : ''} ${isUnread ? 'msg-row-unread' : ''}`}
                  onClick={() => openMessage(msg)}>
                  <div className="msg-row-avatar">
                    {isInbox
                      ? <Avatar firstName={msg.sender_first} lastName={msg.sender_last} size="sm" />
                      : <div className="msg-avatar-class"><Icon name={scopeIcon(msg.scope)} size={14} /></div>
                    }
                    {isUnread && <span className="msg-unread-dot" />}
                  </div>
                  <div className="msg-row-content">
                    <div className="msg-row-top">
                      <span className="msg-row-name">
                        {isInbox
                          ? `${msg.sender_first} ${msg.sender_last}`
                          : scopeLabel(msg.scope, msg.recipient_first, msg.recipient_last, msg.program_name)
                        }
                      </span>
                      <span className="msg-row-time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {hasAtt && (
                          <span style={{ color: 'var(--text3)', display: 'flex' }}>
                            <AttachIcon />
                          </span>
                        )}
                        {timeAgo(msg.created_at)}
                      </span>
                    </div>
                    <div className="msg-row-subject">{msg.subject}</div>
                    <div className="msg-row-preview">{msg.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — thread / compose / empty */}
        <div className="msg-detail-panel">
          {view === 'compose' && (
            <ComposePanel user={user} onCancel={() => setView('list')} onSent={handleSent} />
          )}
          {view === 'thread' && selected && (
            <ThreadView msg={selected} onBack={() => setView('list')} />
          )}
          {view === 'list' && (
            <div className="thread-empty">
              <div style={{ textAlign: 'center' }}>
                <Icon name="envelope" size={36} style={{ color: 'var(--text3)', marginBottom: 12 }} />
                <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>
                  Sélectionnez un message
                </p>
                <button className="btn btn-primary btn-sm" onClick={openCompose}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="pencil" size={12} /> Rédiger un message
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}