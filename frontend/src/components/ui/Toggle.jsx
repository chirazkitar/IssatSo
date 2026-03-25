export default function Toggle({ on, onToggle, label }) {
  return (
    <div className="toggle" onClick={onToggle}>
      <div className={`toggle-track${on ? ' on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
      {label && (
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
      )}
    </div>
  );
}
