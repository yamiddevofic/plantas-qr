import { PLACEHOLDER } from '../../constantes';

export default function ImagenPlanta({ src, alt = '', ancho, alto, prioridad = 'auto', cargando = 'lazy', clase = '', ...props }) {
  return (
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      width={ancho}
      height={alto}
      loading={cargando}
      fetchpriority={prioridad}
      decoding="async"
      className={clase}
      onError={(e) => { e.target.src = PLACEHOLDER; }}
      {...props}
    />
  );
}