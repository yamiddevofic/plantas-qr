import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Drawer lateral del menú hamburguesa: panel fijo desde la derecha con
 * backdrop, cierre con Escape y foco en el botón ✕ al abrir. El contenido
 * (grupos/ítems, p. ej. <GrupoMenu>) se pasa como children, lo que permite
 * reutilizar el mismo menú en cualquier página.
 */
export default function MenuLateral({ abierto, onCerrar, children }) {
  const cerrarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclado = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclado);
    cerrarRef.current?.focus();
    return () => document.removeEventListener('keydown', alTeclado);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <>
      <div className="menu-movil-backdrop" onClick={onCerrar} aria-hidden="true" />
      <nav
        className="menu-panel"
        id="menu-herramientas-panel"
        aria-label="Menú principal"
      >
        <div className="menu-cabecera">
          <p className="menu-cabecera-titulo">Menú</p>
          <button
            ref={cerrarRef}
            type="button"
            className="menu-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar menú principal"
          >
            ✕
          </button>
        </div>
        {children}
      </nav>
    </>
  );
}

MenuLateral.propTypes = {
  /** Controla la apertura del drawer. */
  abierto: PropTypes.bool.isRequired,
  /** Cierra el drawer (Escape, backdrop o botón ✕). */
  onCerrar: PropTypes.func.isRequired,
  /** Grupos e ítems del menú. */
  children: PropTypes.node,
};