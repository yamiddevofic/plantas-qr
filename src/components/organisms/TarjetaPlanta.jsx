import CarruselImagenes from './CarruselImagenes';
import { useTema } from '../../tema.js';

export default function TarjetaPlanta({ planta, indice = 0 }) {
  // En modo noche, si la especie tiene portada de noche, la tarjeta muestra solo
  // esa (sin carrusel: las demás fotos son de día).
  const deNoche = useTema().tema === 'oscuro' && Boolean(planta.imagenNoche);
  return (
    <a
      href={`#/planta/${planta._id}`}
      className="planta-card"
      style={{ '--d': Math.min(indice, 8) }}
    >
      <CarruselImagenes planta={deNoche ? { ...planta, imagen: planta.imagenNoche, imagenes: [] } : planta} />
      <div className="card-nombre-overlay">
        <h3 className="card-nombre">{planta.nombre.comun}</h3>
        <p className="card-cientifico">{planta.nombre.cientifico}</p>
      </div>
    </a>
  );
}