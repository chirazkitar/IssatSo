import { useEffect, useRef, useState } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import Icon from '../icons';
import { Chip } from '../ui/Badge';

export default function NotifBell({ onOpenMessaging }) {
  const { unreadCount, inbox } = useMessaging();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const recentUnread = inbox.filter((m) => m.unread).slice(0, 4);
  const total = unreadCount;

  function handleMsgClick() {
    setOpen(false);
    if (onOpenMessaging) onOpenMessaging();
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "A l'instant";
    if (m < 60) return m + 'min';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h';
    return Math.floor(h / 24) + 'j';
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        title={total + ' message(s) non lu(s)'}
        style={{ border: '1px solid var(--border)' }}
      >
        <Icon name="bell" size={15} />
        {total > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <h4>
              Notifications
              {total > 0 && (
                <Chip variant="chip-red" style={{ marginLeft: 6 }}>{total}</Chip>
              )}
            </h4>
            <button className="btn btn-ghost btn-sm" onClick={handleMsgClick}>
              Voir tout
            </button>
          </div>

          {total === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
              <div style={{ marginBottom: 6 }}><Icon name="checkCircle" size={22} /></div>
              Aucun message non lu
            </div>
          ) : (
            recentUnread.map((m) => (
              <div
                key={m.id}
                className="notif-item"
                onClick={handleMsgClick}
                style={{ background: 'rgba(79,99,240,0.04)' }}
              >
                <div className="notif-item-icon">
                  <Icon name={m.scope === 'class' ? 'people' : 'envelope'} size={14} />
                </div>
                <div className="notif-content" style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.sender_first} {m.sender_last}
                  </p>
                  <p style={{ fontWeight: 500, color: 'var(--text2)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.subject}
                  </p>
                  <small style={{ color: 'var(--text3)' }}>{timeAgo(m.created_at)}</small>
                </div>
                <div className="notif-dot-new" style={{ flexShrink: 0 }} />
              </div>
            ))
          )}

          {total > 4 && (
            <div
              onClick={handleMsgClick}
              style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: 'var(--accent2)', cursor: 'pointer', borderTop: '1px solid var(--border)' }}
            >
              +{total - 4} autres messages non lus
            </div>
          )}

          <div
            onClick={handleMsgClick}
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', borderTop: '1px solid var(--border)', fontWeight: 500 }}
          >
            <Icon name="envelope" size={13} />
            Ouvrir la messagerie
          </div>
        </div>
      )}
    </div>
  );
}
