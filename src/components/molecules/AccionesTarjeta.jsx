import Boton from '../atoms/Boton';

export default function AccionesTarjeta({ nombreComun, tieneQR, cargando, onRegenerar, onDescargar, onEditar, onEliminar }) {
  return (
    <div className="card-actions">
      <Boton variante="regenerate" onClick={onRegenerar} disabled={cargando} aria-label={`Regenerar código QR de ${nombreComun}`} title="Regenerar QR">
        ↻
      </Boton>
      <Boton variante="download" onClick={onDescargar} disabled={!tieneQR} aria-label={`Descargar código QR de ${nombreComun}`} title="Descargar QR">
        ⤓
      </Boton>
      <Boton variante="edit" onClick={onEditar} disabled={cargando} aria-label={`Editar ${nombreComun}`} title="Editar planta">
        ✎
      </Boton>
      <Boton variante="delete" onClick={onEliminar} disabled={cargando} aria-label={`Eliminar ${nombreComun}`} title="Eliminar planta">
        ✕
      </Boton>
    </div>
  );
}