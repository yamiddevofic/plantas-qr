import Boton from '../atoms/Boton';

export default function BarraHerramientas({
  total,
  filtrados,
  activos,
  generando,
  puedeGenerar,
  onCrear,
  onRegenerarTodos,
  onActualizar,
}) {
  return (
    <div className="toolbar">
      <p className="count">
        <span className="count-dot" aria-hidden="true" />
        {activos
          ? `${filtrados} de ${total} ${total === 1 ? 'especie' : 'especies'}`
          : `${total} ${total === 1 ? 'especie registrada' : 'especies registradas'}`}
      </p>
      <Boton variante="primary" onClick={onCrear}>
        + Agregar especie
      </Boton>
      <Boton
        variante="ghost"
        onClick={onRegenerarTodos}
        disabled={generando || !puedeGenerar}
        title="Regenerar el código QR de todas las plantas"
      >
        {generando ? 'Regenerando QRs…' : 'Regenerar todos los QRs'}
      </Boton>
      <Boton variante="ghost" onClick={onActualizar}>
        Actualizar
      </Boton>
    </div>
  );
}