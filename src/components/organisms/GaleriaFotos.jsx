import { useState } from 'react';
import ImagenPlanta from '../atoms/ImagenPlanta';
import InsigniasPlanta from '../molecules/InsigniasPlanta';

export default function GaleriaFotos({ imagenes, ejemplares, alt, tipo, estado }) {
  const [indice, setIndice] = useState(0);

  const ubicacionActual = ejemplares[indice]?.ubicacion || '';

  if (imagenes.length <= 1) {
    return (
      <div className="detalle-image">
        <ImagenPlanta src={imagenes[0]} alt={alt} ancho={1600} alto={1000} prioridad="high" cargando="eager" />
        <InsigniasPlanta tipo={tipo} estado={estado} />
        {ubicacionActual && <p className="galeria-caption">📍 {ubicacionActual}</p>}
      </div>
    );
  }

  const anterior = () => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  const siguiente = () => setIndice((i) => (i + 1) % imagenes.length);

  return (
    <div className="detalle-image detalle-galeria">
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
        <button type="button" className="galeria-nav galeria-nav-prev" onClick={anterior} aria-label="Imagen anterior">
          <span aria-hidden="true">‹</span>
        </button>
        <button type="button" className="galeria-nav galeria-nav-next" onClick={siguiente} aria-label="Imagen siguiente">
          <span aria-hidden="true">›</span>
        </button>
        <InsigniasPlanta tipo={tipo} estado={estado} />
      </div>
      <div className="galeria-barra">
        {imagenes.map((img, i) => (
          <button
            type="button"
            key={i}
            className={`galeria-dot ${i === indice ? 'activo' : ''}`}
            onClick={() => setIndice(i)}
            aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
            aria-pressed={i === indice}
          />
        ))}
        <span className="galeria-contador" aria-hidden="true">{indice + 1} / {imagenes.length}</span>
      </div>
      {ubicacionActual && <p className="galeria-caption">📍 {ubicacionActual}</p>}
    </div>
  );
}