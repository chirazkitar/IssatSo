import { NAV_ITEMS_BY_ROLE, getRoleLabel } from '../../utils/helpers';
import Avatar from '../ui/Avatar';

export default function Sidebar({ user, page, setPage, onLogout, open, onClose }) {
  const items = NAV_ITEMS_BY_ROLE[user.role] || NAV_ITEMS_BY_ROLE.student;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'show' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div>
            <div className="logo-text">UniPlatform</div>
            <div className="logo-sub">Académique</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {items.map((item, i) => (
            <div
              key={item.key}
              className={`nav-item${page === item.key ? ' active' : ''}`}
              style={{
                animation: `slideRight 0.35s ${i * 0.04}s ease forwards`,
                opacity: 0,
              }}
              onClick={() => {
                setPage(item.key);
                onClose();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>

        {/* Footer / user card */}
        <div className="sidebar-footer">
          <div className="user-card" onClick={onLogout} title="Déconnexion">
            <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" />
            <div className="user-card-info">
              <div className="user-card-name">
                {user.first_name} {user.last_name}
              </div>
              <div className="user-card-role">{getRoleLabel(user.role)}</div>
            </div>
            <span className="logout-icon">⎋</span>
          </div>
        </div>
      </aside>
    </>
  );
}
