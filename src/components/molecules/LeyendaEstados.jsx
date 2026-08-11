import { useEffect, useRef } from 'react';
import Boton from '../atoms/Boton';
import { ESCALA_CONSERVACION } from '../../constantes';

/**
 * Ventana desplegable con la escala termómetro de conservación:
 * cada estado con su color, tal como aparece en las fichas del catálogo.
 */
export default function LeyendaEstados({ onCerrar }) {
  const modalRef = useRef(null);

  useEffect(() => {
    modalRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        className="modal leyenda-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leyenda-titulo"
        ref={modalRef}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="leyenda-titulo" className="modal-titulo">Estados de conservación</h2>
          <Boton variante="ghost" clase="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </Boton>
        </header>

        <p className="leyenda-descripcion">
          Escala termómetro de riesgo, basada en las categorías IUCN. Cada ficha del
          catálogo muestra su estado con estos colores.
        </p>

        <ul className="leyenda-estados">
          {ESCALA_CONSERVACION.map((estado) => (
            <li key={estado.clase} className="leyenda-estado">
              <span className={`leyenda-estado-muestra ${estado.clase}`} aria-hidden="true" />
              <div>
                <p className="leyenda-estado-etiqueta">{estado.etiqueta}</p>
                <p className="leyenda-estado-descripcion">{estado.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}