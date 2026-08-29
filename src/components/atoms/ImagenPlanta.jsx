import { useState } from 'react';
import { PLACEHOLDER } from '../../constantes';
import VARIANTES from '../../variantesImagenes.json';

/* Solo el catálogo versionado en public/uploads tiene recortes -400/-800
   (los genera `npm run generar-variantes`). Lo que se sube desde el panel admin
   no los tiene, así que a esas fotos no se les pone srcset: pedir un recorte
   inexistente daría 404 y el navegador no reintenta con el original. */
const CON_VARIANTES = new Set(VARIANTES);
const ANCHOS = [400, 800];

function construirSrcSet(src) {
  if (typeof src !== 'string') return null;
  const coincide = src.match(/^\/uploads\/(.+)\.webp$/);
  if (!coincide || !CON_VARIANTES.has(coincide[1])) return null;
  const base = `/uploads/${coincide[1]}`;
  return [...ANCHOS.map((a) => `${base}-${a}.webp ${a}w`), `${src} 1200w`].join(', ');
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
