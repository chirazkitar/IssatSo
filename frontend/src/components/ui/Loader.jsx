import Spinner from './Spinner';

export default function Loader({ text = 'Chargement...' }) {
  return (
    <div className="loader">
      <Spinner />
      <span>{text}</span>
    </div>
  );
}
