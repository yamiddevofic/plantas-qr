import IconoLupa from '../atoms/IconoLupa';

export default function Busqueda({ valor, onChange, onLimpiar }) {
  return (
    <div className="filtro-busqueda">
      <IconoLupa />
      <label className="visually-hidden" htmlFor="buscar-planta">
        Buscar por nombre común, nombre científico o ID
      </label>
      <input
        id="buscar-planta"
        type="search"
        placeholder="Buscar por nombre o ID…"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      {valor && (
        <button
          type="button"
          className="filtro-limpiar-texto"
          onClick={onLimpiar}
          aria-label="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
}