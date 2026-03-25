export default function ProgressBar({ value, color = 'linear-gradient(90deg,var(--accent),var(--accent3))' }) {
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color }}
      />
    </div>
  );
}
