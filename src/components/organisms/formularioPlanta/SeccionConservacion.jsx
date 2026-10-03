import CampoFormulario from '../../molecules/CampoFormulario';
import { ESTADOS_CONSERVACION } from './datosPlanta';

export default function SeccionConservacion({ estado, errores, set }) {
  return (
    <section className="form-seccion" aria-label="Conservación y ubicación">
      <h3 className="form-seccion-titulo">Conservación y ubicación</h3>
      <div className="form-grid">
        <CampoFormulario id="f-estado" etiqueta="Estado de conservación" requerido error={errores.estadoConservacion}>
          <select
            id="f-estado"
            className="form-select"
            value={estado.estadoConservacion}
            onChange={(e) => set('estadoConservacion', e.target.value)}
            required
          >
            {ESTADOS_CONSERVACION.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </CampoFormulario>
        <CampoFormulario id="f-lat" etiqueta="Latitud" requerido error={errores.latitud}>
          <input
            id="f-lat"
            className="form-input"
            type="number"
            step="any"
            inputMode="decimal"
            value={estado.latitud}
            onChange={(e) => set('latitud', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-lng" etiqueta="Longitud" requerido error={errores.longitud}>
          <input
            id="f-lng"
            className="form-input"
            type="number"
            step="any"
            inputMode="decimal"
            value={estado.longitud}
            onChange={(e) => set('longitud', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-ubicacion" etiqueta="Descripción de la ubicación">
          <input
            id="f-ubicacion"
            className="form-input"
            placeholder="Ej. Esquina noreste del parque"
            value={estado.ubicacionDescripcion}
            onChange={(e) => set('ubicacionDescripcion', e.target.value)}
          />
        </CampoFormulario>
      </div>
    </section>
  );
}
