import TarjetaPlanta from './TarjetaPlanta';

export default function ListaPlantas({ plantas }) {
  return (
    <div className="planta-grid">
      {plantas.map((p, i) => (
        <TarjetaPlanta key={p._id} planta={p} indice={i} />
      ))}
    </div>
  );
}