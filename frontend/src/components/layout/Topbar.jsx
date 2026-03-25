import { useTheme } from '../../context/ThemeContext';
import { getRoleCls, getRoleLabel, PAGE_TITLES } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import NotifBell from './NotifBell';

export default function Topbar({ user, page, onMenuToggle }) {
  const { theme, toggle } = useTheme();
  const title = PAGE_TITLES[page] || page;

  return (
    <header className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          ☰
        </button>
        <div>
          <div className="topbar-title">{title}</div>
          <div className="topbar-breadcrumb">
            UniPlatform › {title}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Theme toggle */}
        <div
          className="icon-btn"
          onClick={toggle}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </div>

        {/* Notification bell */}
        <NotifBell />

        {/* User pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            background: 'var(--card)',
            borderRadius: 'var(--radius2)',
            border: '1px solid var(--border)',
          }}
        >
          <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" />
          <RoleBadge role={user.role} />
        </div>
      </div>
    </header>
  );
}
