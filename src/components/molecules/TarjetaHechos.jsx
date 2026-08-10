export default function TarjetaHechos({ datos }) {
  return (
    <div className="card-facts">
      {datos.map((d) => d.texto && (
        <span className="card-fact" key={d.texto}>
          <span aria-hidden="true">{d.icono}</span>
          <span>{d.texto}</span>
        </span>
      ))}
    </div>
  );
}