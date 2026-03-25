export default function StatCard({ glyph, value, label, sub, color, animClass = '', onClick }) {
  return (
    <div
      className={`stat-card card-hover ${animClass}`}
      style={{ '--stat-color': color, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="stat-glyph">{glyph}</div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
