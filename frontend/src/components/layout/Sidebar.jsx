import { NAV_ITEMS_BY_ROLE, getRoleLabel } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import Icon from '../icons';

export default function Sidebar({ user, page, setPage, onLogout, open, onClose }) {
  const items = NAV_ITEMS_BY_ROLE[user.role] || NAV_ITEMS_BY_ROLE.student;

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'show' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* ── Logo ── */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <Icon name="mortarboard" size={20} />
          </div>
          <div className="logo-text-wrap">
            <div className="logo-name">UniPlatform</div>
            <div className="logo-sub">Académique</div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {items.map((item, i) => (
            <div
              key={item.key}
              className={`nav-item${page === item.key ? ' active' : ''}`}
              style={{
                animation: `slideInLeft 0.32s ${i * 0.04}s ease forwards`,
                opacity: 0,
              }}
              onClick={() => {
                setPage(item.key);
                onClose();
              }}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>

        {/* ── User footer ── */}
        <div className="sidebar-footer">
          <div className="user-card" onClick={onLogout} title="Déconnexion">
            <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" />
            <div className="user-card-info">
              <div className="user-card-name">
                {user.first_name} {user.last_name}
              </div>
              <div className="user-card-role">{getRoleLabel(user.role)}</div>
            </div>
            <span className="logout-icon">
              <Icon name="boxArrowRight" size={14} />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
