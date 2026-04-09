import Icon from '../icons';

export default function EmptyState({ icon = 'fileEarmark', title = 'Aucune donnée', sub = '' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}
