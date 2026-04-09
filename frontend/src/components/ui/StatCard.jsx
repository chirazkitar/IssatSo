import Icon from '../icons';

export default function StatCard({
  iconName,
  value,
  label,
  sub,
  color = 'var(--accent)',
  colorSoft = 'var(--blue-soft)',
  animClass = '',
  onClick,
}) {
  return (
    <div
      className={`stat-card card-hover ${animClass}`}
      style={{
        '--stat-accent':      color,
        '--stat-accent-soft': colorSoft,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <div className="stat-icon">
        <Icon name={iconName} size={18} />
      </div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
