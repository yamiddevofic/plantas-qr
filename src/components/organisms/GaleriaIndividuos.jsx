import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { LuChevronLeft, LuChevronRight, LuMapPin, LuX } from 'react-icons/lu';
import { IconoArbol } from '../atoms/IconosInicio';

const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

function detalle({ altitudMsnm, precisionGpsM }) {
  return [
    altitudMsnm != null && `${numero.format(altitudMsnm)} msnm`,
    precisionGpsM != null && `GPS ±${numero.format(precisionGpsM)} m`,
  ].filter(Boolean).join(' · ');
}

function Miniatura({ src, codigo }) {
  const [rota, setRota] = useState(false);
  if (!src || rota) {
    return (
      <span className="galeria-individuo-vacia" aria-hidden="true">
        <IconoArbol />
        Sin foto aún
      </span>
    );
  }
  return <img src={src} alt={`Fotografía del árbol ${codigo}`} loading="lazy" decoding="async" onError={() => setRota(true)} />;
}

Miniatura.propTypes = { src: PropTypes.string, codigo: PropTypes.string.isRequired };

/** Visor a pantalla completa de las fotos de los individuos, con paso entre ellas. */
function VisorIndividuo({ individuos, indice, onCambiar, onCerrar, onVer }) {
  const cerrarRef = useRef(null);
  const total = individuos.length;
  const { codigoArbol, imagen, imagenEscritorio, ...resto } = individuos[indice].properties;
  const anterior = useCallback(() => onCambiar((indice - 1 + total) % total), [indice, total, onCambiar]);
  const siguiente = useCallback(() => onCambiar((indice + 1) % total), [indice, total, onCambiar]);

  useEffect(() => {
    const previo = document.activeElement;
    cerrarRef.current?.focus();
    const desbloqueo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = desbloqueo;
      previo?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar();
      else if (e.key === 'ArrowLeft' && total > 1) anterior();
      else if (e.key === 'ArrowRight' && total > 1) siguiente();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar, anterior, siguiente, total]);

  const info = detalle(resto);

  return createPortal(
    <div
      className="visor-individuo"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto del árbol ${codigoArbol}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <button ref={cerrarRef} type="button" className="visor-boton visor-cerrar" onClick={onCerrar} aria-label="Cerrar">
        <LuX aria-hidden="true" />
      </button>

      <figure className="visor-figura">
        <picture key={imagen}>
          {imagenEscritorio && <source media="(min-width: 900px)" srcSet={imagenEscritorio} />}
          <img src={imagen} alt={`Fotografía del árbol ${codigoArbol}`} />
        </picture>
        <figcaption className="visor-pie">
          <span>
            <strong>{codigoArbol}</strong>
            {info && <span>{info}</span>}
          </span>
          <button type="button" className="btn btn-primary" onClick={() => onVer(individuos[indice])}>
            <LuMapPin aria-hidden="true" className="btn-lupa-icono" />
            Ver en el mapa
          </button>
        </figcaption>
      </figure>

      {total > 1 && (
        <>
          <button type="button" className="visor-boton visor-anterior" onClick={anterior} aria-label="Foto anterior">
            <LuChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="visor-boton visor-siguiente" onClick={siguiente} aria-label="Foto siguiente">
            <LuChevronRight aria-hidden="true" />
          </button>
          <p className="visor-contador" aria-live="polite">{indice + 1} / {total}</p>
        </>
      )}
    </div>,
    document.body,
  );
}

VisorIndividuo.propTypes = {
  individuos: PropTypes.arrayOf(PropTypes.object).isRequired,
  indice: PropTypes.number.isRequired,
  onCambiar: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
  onVer: PropTypes.func.isRequired,
};

// Con más tarjetas que esto los puntos estorban: se muestra un contador.
const MAX_PUNTOS = 12;

const reducirMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Carrusel de fotos de los individuos de la especie: se desliza con el dedo
 * (con ajuste a cada tarjeta), con flechas en pantallas grandes y puntos de
 * posición. Tocar una foto la abre en grande (con "Ver en el mapa"); un árbol
 * sin foto va directo a su punto del mapa.
 */
export default function GaleriaIndividuos({ individuos, seleccionado = null, onVer }) {
  const conFoto = individuos.filter((f) => f.properties.imagen);
  const [visor, setVisor] = useState(null);
  const pistaRef = useRef(null);
  const [posicion, setPosicion] = useState({ actual: 0, atras: false, adelante: false });

  const abrir = (feature) => {
    const i = conFoto.indexOf(feature);
    if (i >= 0) setVisor(i);
    else onVer(feature);
  };

  // Paso entre tarjetas: ancho de una tarjeta más el espacio entre ellas.
  const paso = () => {
    const pista = pistaRef.current;
    const [a, b] = pista?.children ?? [];
    if (!a) return 0;
    return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
  };

  const actualizar = useCallback(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    const p = paso() || 1;
    const fin = pista.scrollWidth - pista.clientWidth;
    setPosicion({
      actual: Math.min(individuos.length - 1, Math.round(pista.scrollLeft / p)),
      atras: pista.scrollLeft > 4,
      adelante: pista.scrollLeft < fin - 4,
    });
  }, [individuos.length]);

  // Al cambiar de tamaño (y al montarse) se recalculan las flechas.
  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista || typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(actualizar);
    observador.observe(pista);
    return () => observador.disconnect();
  }, [actualizar]);

  const irA = useCallback((indice) => {
    const pista = pistaRef.current;
    const tarjeta = pista?.children[indice];
    if (!tarjeta) return;
    pista.scrollTo({
      left: tarjeta.offsetLeft - pista.children[0].offsetLeft,
      behavior: reducirMovimiento() ? 'auto' : 'smooth',
    });
  }, []);

  const mover = (direccion) => {
    pistaRef.current?.scrollBy({ left: direccion * paso(), behavior: reducirMovimiento() ? 'auto' : 'smooth' });
  };

  // Si se elige un árbol en el mapa, el carrusel lo trae a la vista.
  useEffect(() => {
    if (!seleccionado) return;
    const indice = individuos.findIndex((f) => f.properties.id === seleccionado);
    if (indice >= 0) irA(indice);
  }, [seleccionado, individuos, irA]);

  const total = individuos.length;

  return (
    <div className="galeria-individuos">
      <div className="galeria-individuos-cabecera">
        <p className="ficha-individuos-titulo">
          {total} {total === 1 ? 'individuo registrado' : 'individuos registrados'} en el parque
        </p>
        {total > 1 && (
          <div className="galeria-individuos-flechas">
            <button type="button" onClick={() => mover(-1)} disabled={!posicion.atras} aria-label="Individuos anteriores">
              <LuChevronLeft aria-hidden="true" />
            </button>
            <button type="button" onClick={() => mover(1)} disabled={!posicion.adelante} aria-label="Individuos siguientes">
              <LuChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <ul
        ref={pistaRef}
        className="galeria-individuos-pista"
        onScroll={actualizar}
        aria-label="Fotos de los individuos"
      >
        {individuos.map((feature, i) => {
          const { id, codigoArbol, imagen } = feature.properties;
          const info = detalle(feature.properties);
          return (
            <li key={id} style={{ '--i': i }}>
              <button
                type="button"
                className={`galeria-individuo${seleccionado === id ? ' activo' : ''}`}
                aria-pressed={seleccionado === id}
                aria-label={imagen ? `Ver la foto del árbol ${codigoArbol}` : `Ver el árbol ${codigoArbol} en el mapa`}
                onClick={() => abrir(feature)}
              >
                <span className="galeria-individuo-foto">
                  <Miniatura src={imagen} codigo={codigoArbol} />
                </span>
                <span className="galeria-individuo-pie">
                  <strong>{codigoArbol}</strong>
                  {info && <span>{info}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {total > 1 && (posicion.atras || posicion.adelante) && (
        total <= MAX_PUNTOS ? (
          <div className="galeria-individuos-puntos" role="group" aria-label="Posición en el carrusel">
            {individuos.map((f, i) => (
              <button
                key={f.properties.id}
                type="button"
                className={i === posicion.actual ? 'activo' : ''}
                aria-label={`Ir a ${f.properties.codigoArbol}`}
                aria-current={i === posicion.actual ? 'true' : undefined}
                onClick={() => irA(i)}
              />
            ))}
          </div>
        ) : (
          <p className="galeria-individuos-contador" aria-live="polite">{posicion.actual + 1} / {total}</p>
        )
      )}

      {visor !== null && conFoto[visor] && (
        <VisorIndividuo
          individuos={conFoto}
          indice={visor}
          onCambiar={setVisor}
          onCerrar={() => setVisor(null)}
          onVer={(feature) => {
            setVisor(null);
            onVer(feature);
          }}
        />
      )}
    </div>
  );
}

GaleriaIndividuos.propTypes = {
  individuos: PropTypes.arrayOf(PropTypes.object).isRequired,
  seleccionado: PropTypes.string,
  onVer: PropTypes.func.isRequired,
};
