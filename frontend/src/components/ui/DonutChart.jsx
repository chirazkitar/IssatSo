export default function DonutChart({ value, max = 20, color = 'var(--accent)', size = 120, label = '/20' }) {
  const r    = 46;
  const cx   = 60;
  const cy   = 60;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(parseFloat(value) / max || 0, 1);
  const dash = pct * circ;

  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth="12" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="donut-label">
        <div className="donut-val" style={{ color }}>{value ?? '—'}</div>
        <div className="donut-sub">{label}</div>
      </div>
    </div>
  );
}
