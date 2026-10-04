import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { IconoFamilias, IconoHoja, IconoQr } from '../atoms/IconosInicio';
import PaisajeHero from './PaisajeHero';

/**
 * Encabezado de la galería con el mismo lenguaje del inicio: paisaje SVG del
 * parque (claro/oscuro) con el sol o la luna a un lado, titular con acento serif
 * y cifras del catálogo. Más bajo que el hero del inicio para llegar rápido a las fichas.
 */
export default function HeroGaleria({ plantas, cargando = false }) {
  const cifras = useMemo(() => {
    if (cargando || !plantas.length) return null;
    const familias = new Set(plantas.map((p) => p.familia).filter(Boolean)).size;
    return [
      { Icono: IconoHoja, valor: plantas.length, etiqueta: plantas.length === 1 ? 'especie' : 'especies' },
      { Icono: IconoFamilias, valor: familias, etiqueta: familias === 1 ? 'familia' : 'familias' },
      { Icono: IconoQr, valor: 'QR', etiqueta: 'en cada árbol' },
    ];
  }, [plantas, cargando]);

  return (
    <header className="hero-inicio hero-galeria">
      <PaisajeHero />

      <div className="hero-inicio-contenido">
        <div className="hero-inicio-texto-bloque">
          <p className="hero-inicio-ubicacion">
            <IconoHoja />
            <span>Catálogo del Parque Principal</span>
          </p>

          <h1 id="catalogo-titulo" className="hero-inicio-titulo">
            <span className="hero-inicio-palabra" style={{ '--i': 0 }}>Nuestras</span>{' '}
            <span className="hero-inicio-palabra hero-inicio-acento" style={{ '--i': 1 }}>especies</span>
          </h1>

          <p className="hero-inicio-texto">
            Cada árbol del parque de Chitagá con su ficha: toca una especie para
            conocer su familia, origen, usos y estado de conservación.
          </p>

          {cifras && (
            <ul className="hero-galeria-cifras" aria-label="Resumen del catálogo">
              {cifras.map(({ Icono, valor, etiqueta }) => (
                <li key={etiqueta}>
                  <Icono />
                  <strong>{valor}</strong> {etiqueta}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

HeroGaleria.propTypes = {
  /** Catálogo completo (sin filtros) para las cifras. */
  plantas: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Mientras carga se ocultan las cifras. */
  cargando: PropTypes.bool,
};
