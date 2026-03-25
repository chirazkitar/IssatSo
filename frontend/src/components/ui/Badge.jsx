import { getRoleCls, getRoleLabel, getMentionCls } from '../../utils/helpers';

export function RoleBadge({ role }) {
  return (
    <span className={`role-badge ${getRoleCls(role)}`}>
      {getRoleLabel(role)}
    </span>
  );
}

export function MentionBadge({ mention }) {
  if (!mention) return <span style={{ color: 'var(--text3)' }}>—</span>;
  return (
    <span className={`grade-badge ${getMentionCls(mention)}`}>{mention}</span>
  );
}

export function Chip({ children, variant = '' }) {
  return <span className={`chip ${variant}`}>{children}</span>;
}
