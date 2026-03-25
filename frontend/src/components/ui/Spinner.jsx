export default function Spinner({ size = 28, borderWidth = 2.5 }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, borderWidth }}
    />
  );
}
