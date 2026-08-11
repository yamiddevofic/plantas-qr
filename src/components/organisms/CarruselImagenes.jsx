import { useEffect, useState } from 'react';
import ImagenPlanta from '../atoms/ImagenPlanta';
import { listaImagenes } from '../../constantes';

const INTERVALO_CARRUSEL = 4500;

export default function CarruselImagenes({ planta, alto = 1200 }) {
  const [indice, setIndice] = useState(0);
  const imagenes = listaImagenes(planta);
  const alt = `Fotografía de ${planta.nombre.comun} (${planta.nombre.cientifico})`;

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, INTERVALO_CARRUSEL);
    return () => clearInterval(id);
  }, [imagenes.length]);

  return (
    <div className={`card-image ${imagenes.length > 1 ? 'is-galeria' : ''}`}>
      {imagenes.length > 1 ? (
        imagenes.map((img, i) => (
          <ImagenPlanta
            key={img}
            src={img}
            alt={i === indice ? alt : ''}
            ancho={1600}
            alto={alto}
            prioridad={i === 0 ? 'high' : 'auto'}
            cargando="lazy"
            clase={i === indice ? 'is-visible' : ''}
          />
        ))
      ) : (
        <ImagenPlanta src={planta.imagen} alt={alt} ancho={1600} alto={alto} prioridad="high" cargando="lazy" />
      )}
    </div>
  );
}