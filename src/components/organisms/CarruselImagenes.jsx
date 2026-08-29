import { useEffect, useState } from 'react';
import ImagenPlanta from '../atoms/ImagenPlanta';
import { listaImagenes } from '../../constantes';

const INTERVALO_CARRUSEL = 4500;

/* La grilla es de 1, 2 o 3 columnas según el ancho (ver .planta-grid). */
const TAMANOS_TARJETA = '(min-width: 980px) 33vw, (min-width: 600px) 50vw, 100vw';

export default function CarruselImagenes({ planta, alto = 1200 }) {
  const [indice, setIndice] = useState(0);
  const [listo, setListo] = useState(false);
  const imagenes = listaImagenes(planta);
  const alt = `Fotografía de ${planta.nombre.comun} (${planta.nombre.cientifico})`;

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, INTERVALO_CARRUSEL);
    return () => clearInterval(id);
  }, [imagenes.length]);

  /* Las fotos del carrusel se apilan con position:absolute, así que el
     navegador las considera visibles y `loading="lazy"` no las frena: montarlas
     todas hacía que el listado pidiera el catálogo entero. Solo se monta la
     visible, y los vecinos —para el fundido y la precarga— cuando ya cargó. */
  const ventana = new Set([indice]);
  if (listo && imagenes.length > 1) {
    ventana.add((indice + 1) % imagenes.length);
    ventana.add((indice - 1 + imagenes.length) % imagenes.length);
  }

  return (
    <div className={`card-image ${imagenes.length > 1 ? 'is-galeria' : ''}`}>
      {imagenes.length > 1 ? (
        imagenes.map((img, i) =>
          ventana.has(i) ? (
            <ImagenPlanta
              key={img}
              src={img}
              alt={i === indice ? alt : ''}
              ancho={1600}
              alto={alto}
              tamanos={TAMANOS_TARJETA}
              prioridad={i === 0 ? 'high' : 'auto'}
              cargando="lazy"
              clase={i === indice ? 'is-visible' : ''}
              alCargar={() => setListo(true)}
            />
          ) : null,
        )
      ) : (
        <ImagenPlanta
          src={planta.imagen}
          alt={alt}
          ancho={1600}
          alto={alto}
          tamanos={TAMANOS_TARJETA}
          prioridad="high"
          cargando="lazy"
        />
      )}
    </div>
  );
}
