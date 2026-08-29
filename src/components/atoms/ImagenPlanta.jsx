import { useState } from 'react';
import { PLACEHOLDER } from '../../constantes';
import VARIANTES from '../../variantesImagenes.json';

/* Solo el catálogo versionado en public/uploads tiene recortes, y no todas las
   fotos tienen los mismos: una que ya nace angosta no genera el de 800px. Por
   eso el srcset se arma con lo que el manifiesto declara para cada una —pedir
   un recorte inexistente da 404 y el navegador no reintenta con el original—,
   y las fotos subidas desde el panel admin, que no están en el manifiesto, se
   quedan sin srcset. */
function construirSrcSet(src) {
  if (typeof src !== 'string') return null;
  const coincide = src.match(/^\/uploads\/(.+)\.webp$/);
  const entrada = coincide && VARIANTES[coincide[1]];
  if (!entrada) return null;
  const base = `/uploads/${coincide[1]}`;
  return [
    ...entrada.recortes.map((a) => `${base}-${a}.webp ${a}w`),
    `${src} ${entrada.ancho}w`,
  ].join(', ');
}

export default function ImagenPlanta({
  src,
  alt = '',
  ancho,
  alto,
  prioridad = 'auto',
  cargando = 'lazy',
  clase = '',
  tamanos = '100vw',
  alCargar,
  ...props
}) {
  const [cargada, setCargada] = useState(false);
  const [fallo, setFallo] = useState(false);
  const clases = ['imagen-planta', clase, cargada ? 'imagen-planta-lista' : ''].filter(Boolean).join(' ');
  const srcSet = fallo ? null : construirSrcSet(src);

  return (
    <img
      src={(fallo && PLACEHOLDER) || src || PLACEHOLDER}
      srcSet={srcSet || undefined}
      sizes={srcSet ? tamanos : undefined}
      alt={alt}
      width={ancho}
      height={alto}
      loading={cargando}
      fetchpriority={prioridad}
      decoding="async"
      className={clases}
      onLoad={() => {
        setCargada(true);
        alCargar?.();
      }}
      onError={() => setFallo(true)}
      {...props}
    />
  );
}
