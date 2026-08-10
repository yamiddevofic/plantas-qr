export default function Spinner({ etiqueta = 'Cargando' }) {
  return <div className="spinner" role="status" aria-label={etiqueta} />;
}