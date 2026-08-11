import { useEffect, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import ImagenPlanta from '../atoms/ImagenPlanta';

const INTERVALO = 4500;
const UMBRAL_DESLIZAMIENTO = 45;

export default function GaleriaFotos({ imagenes, alt }) {
  const [indice, setIndice] = useState(0);
  const toqueInicio = useRef(null);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, INTERVALO);
    return () => clearInterval(id);
  }, [imagenes.length]);

  if (imagenes.length <= 1) {
    return (
      <div className="detalle-image">
        <ImagenPlanta src={imagenes[0]} alt={alt} ancho={1600} alto={1000} prioridad="high" cargando="eager" />
      </div>
    );
  }

  const anterior = (e) => {
    e.stopPropagation();
    setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  };
  const siguiente = (e) => {
    e.stopPropagation();
    setIndice((i) => (i + 1) % imagenes.length);
  };
  const alTocar = (e) => {
    toqueInicio.current = { x: e.clientX, y: e.clientY };
  };
  const alSoltar = (e) => {
    if (!toqueInicio.current) return;
    const dx = e.clientX - toqueInicio.current.x;
    const dy = e.clientY - toqueInicio.current.y;
    toqueInicio.current = null;
    if (Math.abs(dx) < UMBRAL_DESLIZAMIENTO) return;
    if (Math.abs(dx) < Math.abs(dy)) return;
    setIndice((i) =>
      dx < 0
        ? (i + 1) % imagenes.length
        : (i - 1 + imagenes.length) % imagenes.length
    );
  };

  return (
    <div
      className="detalle-image detalle-galeria"
      onPointerDown={alTocar}
      onPointerUp={alSoltar}
    >
      {imagenes.map((img, i) => (
        <ImagenPlanta
          key={img}
          src={img}
          alt={i === indice ? alt : ''}
          ancho={1600}
          alto={1000}
          cargando={i === 0 ? 'eager' : 'lazy'}
          prioridad={i === 0 ? 'high' : 'auto'}
          clase={i === indice ? 'is-visible' : ''}
        />
      ))}
      <div className="galeria-flotas">
        <button type="button" className="galeria-nav" onClick={anterior} aria-label="Imagen anterior">
          <LuChevronLeft aria-hidden="true" />
        </button>
        <button type="button" className="galeria-nav" onClick={siguiente} aria-label="Imagen siguiente">
          <LuChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}