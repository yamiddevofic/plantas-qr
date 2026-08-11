export default function BotonMenu({ abierto, onClick }) {
  return (
    <button
      type="button"
      className="menu-hamburguesa"
      aria-expanded={abierto}
      aria-controls="menu-herramientas-panel"
      aria-label={
        abierto
          ? 'Cerrar menú principal'
          : 'Abrir menú principal'
      }
      onClick={onClick}
    >
      <span className="menu-lineas" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}