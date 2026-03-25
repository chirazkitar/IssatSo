const DEFAULT_COLORS = [
  'var(--green)',
  'var(--accent2)',
  'var(--gold)',
  'var(--text3)',
  'var(--red)',
];

export default function BarChart({ data = [], height = 140 }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bar-chart-wrap" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="bar-col">
          <div className="bar-col-value">{d.value}</div>
          <div
            className="bar-col-bar"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
              animationDelay: `${i * 0.08}s`,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <div className="bar-col-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}
