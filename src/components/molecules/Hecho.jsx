export default function Hecho({ icono, etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className="detalle-fact">
      <span className="detalle-fact-icon" aria-hidden="true">{icono}</span>
      <div>
        <p className="detalle-fact-label">{etiqueta}</p>
        <p className="detalle-fact-value">{valor}</p>
      </div>
    </div>
  );
}