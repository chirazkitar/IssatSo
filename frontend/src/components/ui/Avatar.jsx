import { getInitials } from '../../utils/helpers';

export default function Avatar({ firstName, lastName, size = 'md', style = {} }) {
  return (
    <div className={`avatar avatar-${size}`} style={style}>
      {getInitials(firstName, lastName)}
    </div>
  );
}
