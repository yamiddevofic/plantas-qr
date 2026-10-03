import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LuArrowRight } from 'react-icons/lu';
import ImagenPlanta from '../atoms/ImagenPlanta';
import Boton from '../atoms/Boton';
import BuscadorInicio from './BuscadorInicio';

const TITULO = 'Cada árbol, una historia';
const VELOCIDAD_MS = 70;

/**
 * Hero profesional de la página de inicio: foto aérea del Parque Principal
 * con degradado, un mensaje que explica de una sola mirada qué es el
 * proyecto y dos llamados a la acción (proyecto y galería).
 */
export default function HeroInicio({ onConocerProyecto, plantas = null }) {
  const [visibles, setVisibles] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? TITULO.length : 0
  );
  const [cursor, setCursor] = useState(() =>
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (visibles >= TITULO.length) return;
    let indice = visibles;
    const intervalo = setInterval(() => {
      indice += 1;
      setVisibles(indice);
      if (indice >= TITULO.length) {
        clearInterval(intervalo);
        setTimeout(() => setCursor(false), 1200);
      }
    }, VELOCIDAD_MS);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="hero-inicio">
      <ImagenPlanta
        src="/parque.webp"
        alt="Parque Principal de Chitagá con la Parroquia San Juan Nepomuceno al fondo"
        ancho={1240}
        alto={640}
        prioridad="high"
        cargando="eager"
      />
      <div className="hero-inicio-degradado" aria-hidden="true" />
      <div className="hero-inicio-contenido">
        {/* Rótulo de libreta de campo: dónde está el parque, en vez de una etiqueta genérica. */}
        <p className="hero-inicio-ubicacion">
          <span>Chitagá, Norte de Santander</span>
          <span className="hero-inicio-coordenadas" aria-label="Latitud 7 grados 8 minutos norte, longitud 72 grados 39 minutos oeste, 2.345 metros sobre el nivel del mar">
            7°08′ N · 72°39′ O · 2.345 m
          </span>
        </p>
        <h1 className="hero-inicio-titulo" aria-label={TITULO}>
          <span aria-hidden="true">{TITULO.slice(0, visibles)}</span>
          {cursor && <span className="hero-inicio-cursor" aria-hidden="true" />}
        </h1>
        <p className="hero-inicio-texto">
          Escanea el código QR de cualquier árbol del parque para descubrir su
          ficha: familia, origen, usos y estado de conservación.
        </p>
        <BuscadorInicio plantas={plantas} />
        <div className="hero-inicio-acciones">
          <Boton variante="primary" onClick={onConocerProyecto}>
            Conoce nuestro proyecto
            <LuArrowRight aria-hidden="true" />
          </Boton>
          <a className="hero-inicio-enlace" href="#/galeria">Ver las especies</a>
        </div>
      </div>
      <p className="hero-inicio-pie" aria-hidden="true">Parroquia San Juan Nepomuceno</p>
    </header>
  );
}

HeroInicio.propTypes = {
  /** Navega hasta la sección del proyecto (scroll suave). */
  onConocerProyecto: PropTypes.func.isRequired,
  /** Catálogo para el buscador; null mientras carga. */
  plantas: PropTypes.arrayOf(PropTypes.object),
};