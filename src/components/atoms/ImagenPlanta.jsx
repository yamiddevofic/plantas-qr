import { useState } from 'react';
import { PLACEHOLDER } from '../../constantes';

export default function ImagenPlanta({ src, alt = '', ancho, alto, prioridad = 'auto', cargando = 'lazy', clase = '', ...props }) {
  const [cargada, setCargada] = useState(false);
  const [fallo, setFallo] = useState(false);
  const clases = ['imagen-planta', clase, cargada ? 'imagen-planta-lista' : ''].filter(Boolean).join(' ');

  return (
    <img
      src={(fallo && PLACEHOLDER) || src || PLACEHOLDER}
      alt={alt}
      width={ancho}
      height={alto}
      loading={cargando}
      fetchpriority={prioridad}
      decoding="async"
      className={clases}
      onLoad={() => setCargada(true)}
      onError={() => setFallo(true)}
      {...props}
    />
  );
}