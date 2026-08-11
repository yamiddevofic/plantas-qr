import CarruselImagenes from './CarruselImagenes';

export default function TarjetaPlanta({ planta, indice = 0 }) {
  return (
    <a
      href={`#/planta/${planta._id}`}
      className="planta-card"
      style={{ '--d': Math.min(indice, 8) }}
    >
      <CarruselImagenes planta={planta} />
      <div className="card-nombre-overlay">
        <h3 className="card-nombre">{planta.nombre.comun}</h3>
        <p className="card-cientifico">{planta.nombre.cientifico}</p>
      </div>
    </a>
  );
}