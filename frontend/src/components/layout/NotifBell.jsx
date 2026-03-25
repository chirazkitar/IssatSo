import { useEffect, useRef, useState } from 'react';
import { Chip } from '../ui/Badge';

const INITIAL_NOTIFS = [
  { id: 1, icon: '📊', text: 'Nouvelles notes disponibles en Algorithmique', time: 'Il y a 2h',  unread: true  },
  { id: 2, icon: '📅', text: 'Rappel : Examen de BDD le 15 mars',            time: 'Il y a 1j',  unread: true  },
  { id: 3, icon: '✅', text: 'Votre profil a été mis à jour',                 time: 'Il y a 3j',  unread: false },
];

export default function NotifBell() {
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const ref = useRef(null);

  const unread = notifs.filter((n) => n.unread).length;

  /* Close panel when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = (id) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  const markAll = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        🔔
        {unread > 0 && <span className="notif-dot" />}
      </div>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <h4>
              Notifications{' '}
              {unread > 0 && (
                <Chip variant="chip-red" style={{ marginLeft: 6 }}>
                  {unread}
                </Chip>
              )}
            </h4>
            <button className="btn btn-ghost btn-sm" onClick={markAll}>
              Tout lire
            </button>
          </div>

          {notifs.map((n) => (
            <div
              key={n.id}
              className="notif-item"
              onClick={() => markRead(n.id)}
              style={{ background: n.unread ? 'rgba(91,110,245,0.04)' : '' }}
            >
              <div style={{ fontSize: 20 }}>{n.icon}</div>
              <div className="notif-content" style={{ flex: 1 }}>
                <p style={{ fontWeight: n.unread ? 600 : 400 }}>{n.text}</p>
                <small>{n.time}</small>
              </div>
              {n.unread && <div className="notif-dot-new" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
