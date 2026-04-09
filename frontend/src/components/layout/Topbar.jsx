import { useTheme } from '../../context/ThemeContext';
import { getRoleLabel, PAGE_TITLES } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import NotifBell from './NotifBell';
import Icon from '../icons';

export default function Topbar({ user, page, onMenuToggle, setPage }) {
  const { theme, toggle } = useTheme();
  const title = PAGE_TITLES[page] || page;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Menu">
          <Icon name="menu" size={18} />
        </button>
        <div>
          <div className="topbar-title">{title}</div>
          <div className="topbar-breadcrumb">UniPlatform › {title}</div>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={toggle}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          style={{ background: 'transparent', border: '1px solid var(--border)' }}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
        </button>

        <NotifBell onOpenMessaging={() => setPage && setPage('messaging')} />

        <div className="user-pill">
          <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" />
          <RoleBadge role={user.role} />
        </div>
      </div>
    </header>
  );
}
