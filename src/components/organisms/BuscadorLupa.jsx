import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { LuSearch, LuX } from 'react-icons/lu';
import { fetchPlantas } from '../../api';
import ImagenPlanta from '../atoms/ImagenPlanta';

const LIMITE = 8;

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Buscador en lupa: botón junto al menú que despliega un panel de
 * búsqueda en vivo sobre el catálogo. Al elegir un resultado, navega
 * a la ficha de la especie. Soporta flechas y Enter desde el teclado.
 * Si no recibe `plantas`, carga el catálogo desde la API al abrirse.
 */
export default function BuscadorLupa({ plantas }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const [plantasLocal, setPlantasLocal] = useState(null);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const inputRef = useRef(null);

  const catalogo = plantas || plantasLocal;

  const resultados = useMemo(() => {
    const q = normalizar(texto).trim();
    if (!q || !catalogo) return [];
    return catalogo
      .filter((p) => {
        const campos = [
          normalizar(p.nombre?.comun),
          normalizar(p.nombre?.cientifico),
          normalizar(p.familia),
          normalizar(p.tipo),
        ].join(' ');
        return campos.includes(q);
      })
      .slice(0, LIMITE);
  }, [catalogo, texto]);

  const seleccionar = useCallback((planta) => {
    window.location.hash = `/planta/${planta._id}`;
    setAbierto(false);
  }, []);

  const abrir = async () => {
    setTexto('');
    setActivo(0);
    setAbierto(true);
    if (!catalogo && !cargandoCatalogo) {
      setCargandoCatalogo(true);
      setErrorCarga(null);
      try {
        setPlantasLocal(await fetchPlantas());
      } catch (e) {
        setErrorCarga(e.message);
      } finally {
        setCargandoCatalogo(false);
      }
    }
  };

  useEffect(() => {
    if (!abierto) return undefined;
    inputRef.current?.focus();

    function manejarTeclado(e) {
      if (e.key === 'Escape') {
        setAbierto(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivo((i) => Math.min(i + 1, resultados.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivo((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && resultados[activo]) {
        e.preventDefault();
        seleccionar(resultados[activo]);
      }
    }

    window.addEventListener('keydown', manejarTeclado);
    return () => window.removeEventListener('keydown', manejarTeclado);
  }, [abierto, resultados, activo, seleccionar]);

  return (
    <>
      <button
        type="button"
        className="accion-icono buscador-trigger"
        aria-label="Buscar especies"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
      >
        <LuSearch aria-hidden="true" />
      </button>

      {abierto &&
        createPortal(
          <div
            className="buscador-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAbierto(false);
            }}
          >
            <div className="buscador-panel" role="dialog" aria-modal="true" aria-label="Buscar especies">
            <div className="buscador-fila">
              <LuSearch className="buscador-fila-icono" aria-hidden="true" />
              <input
                ref={inputRef}
                className="buscador-input"
                type="text"
                placeholder="Nombre común, científico, familia o tipo…"
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setActivo(0);
                }}
                aria-label="Buscar especies del parque"
              />
              <button
                type="button"
                className="accion-icono buscador-cerrar"
                aria-label="Cerrar buscador"
                onClick={() => setAbierto(false)}
              >
                <LuX aria-hidden="true" />
              </button>
            </div>

            <ul className="buscador-resultados">
              {!catalogo ? (
                <li className="buscador-vacio">
                  {errorCarga
                    ? `No se pudo cargar el catálogo: ${errorCarga}`
                    : 'Cargando catálogo…'}
                </li>
              ) : resultados.length === 0 ? (
                <li className="buscador-vacio">
                  {texto.trim()
                    ? 'Sin coincidencias en el catálogo.'
                    : 'Escribe para buscar en el catálogo.'}
                </li>
              ) : (
                resultados.map((p, i) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      className={`buscador-resultado ${i === activo ? 'activo' : ''}`}
                      onClick={() => seleccionar(p)}
                      onMouseEnter={() => setActivo(i)}
                    >
                      <ImagenPlanta
                        src={p.imagen || p.imagenes?.[0]}
                        alt=""
                        ancho={44}
                        alto={44}
                        cargando="lazy"
                        clase="buscador-resultado-imagen"
                      />
                      <span className="buscador-resultado-texto">
                        <span className="buscador-resultado-nombre">
                          {p.nombre?.comun}
                        </span>
                        <span className="buscador-resultado-detalle">
                          {p.nombre?.cientifico} · {p.familia}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            <p className="buscador-pista">Enter para abrir la ficha · Esc para cerrar</p>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

BuscadorLupa.propTypes = {
  /** Catálogo completo de especies; si no se pasa, se carga desde la API al abrir. */
  plantas: PropTypes.array,
};