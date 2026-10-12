import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuSearch, LuX } from 'react-icons/lu';
import { buscarPlantas } from '../../buscarPlantas';
import ImagenPlanta from '../atoms/ImagenPlanta';

/**
 * Barra de búsqueda abierta (campo largo, siempre visible) para el catálogo.
 * Escribir despliega debajo los resultados en vivo; Enter o un clic abre la
 * ficha. Flechas para recorrer, Esc para cerrar y limpiar.
 */
export default function BuscadorBarra({ plantas }) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const raizRef = useRef(null);
  const inputRef = useRef(null);

  const resultados = useMemo(() => buscarPlantas(plantas, texto), [plantas, texto]);
  const hayTexto = texto.trim().length > 0;
  const mostrar = abierto && hayTexto;

  // Un clic fuera cierra la lista.
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (!raizRef.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  const abrirFicha = (planta) => {
    window.location.hash = `#/planta/${planta._id}`;
  };

  const alTeclear = (e) => {
    if (e.key === 'Escape') {
      if (texto) setTexto('');
      setAbierto(false);
    } else if (e.key === 'ArrowDown' && resultados.length) {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp' && resultados.length) {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && mostrar && resultados[activo]) {
      e.preventDefault();
      abrirFicha(resultados[activo]);
    }
  };

  return (
    <div className="buscador-barra" ref={raizRef} role="search">
      <LuSearch className="buscador-barra-icono" aria-hidden="true" />
      <input
        ref={inputRef}
        className="buscador-barra-input"
        type="search"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={`${id}-lista`}
        aria-activedescendant={mostrar && resultados[activo] ? `${id}-${resultados[activo]._id}` : undefined}
        aria-label="Buscar especies del parque"
        placeholder="Buscar por nombre, familia o tipo…"
        autoComplete="off"
        enterKeyHint="search"
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setActivo(0); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alTeclear}
      />
      {hayTexto && (
        <button
          type="button"
          className="buscador-barra-limpiar"
          aria-label="Borrar la búsqueda"
          onClick={() => { setTexto(''); inputRef.current?.focus(); }}
        >
          <LuX aria-hidden="true" />
        </button>
      )}

      {mostrar && (
        <ul className="buscador-barra-lista" id={`${id}-lista`} role="listbox" aria-label="Resultados">
          {resultados.length === 0 ? (
            <li className="buscador-vacio" role="option" aria-selected="false" aria-disabled="true">
              Sin coincidencias en el catálogo.
            </li>
          ) : (
            resultados.map((p, i) => (
              <li key={p._id} role="presentation">
                <button
                  type="button"
                  id={`${id}-${p._id}`}
                  role="option"
                  aria-selected={i === activo}
                  className={`buscador-resultado${i === activo ? ' activo' : ''}`}
                  onClick={() => abrirFicha(p)}
                  onMouseEnter={() => setActivo(i)}
                >
                  <ImagenPlanta
                    src={p.imagen || p.imagenes?.[0]}
                    alt=""
                    ancho={44}
                    alto={44}
                    tamanos="44px"
                    cargando="lazy"
                    clase="buscador-resultado-imagen"
                  />
                  <span className="buscador-resultado-texto">
                    <span className="buscador-resultado-nombre">{p.nombre?.comun}</span>
                    <span className="buscador-resultado-detalle">{p.nombre?.cientifico} · {p.familia}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

BuscadorBarra.propTypes = {
  /** Catálogo completo de especies. */
  plantas: PropTypes.array,
};
