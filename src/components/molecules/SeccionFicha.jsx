export default function SeccionFicha({ id, titulo, children }) {
  return (
    <section className="detalle-seccion" aria-labelledby={id}>
      <h3 id={id} className="detalle-seccion-titulo">
        {titulo}
        <span className="detalle-divisor" aria-hidden="true" />
      </h3>
      {children}
    </section>
  );
}