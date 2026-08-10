export default function SelectorFiltro({ etiqueta, valor, opciones, onCambio, opcionVacia = 'Todos' }) {
  return (
    <label className="filtro-campo">
      <span className="filtro-etiqueta">{etiqueta}</span>
      <select value={valor} onChange={(e) => onCambio(e.target.value)}>
        <option value="">{opcionVacia}</option>
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}