import CampoFormulario from '../../molecules/CampoFormulario';
import { TIPOS } from './datosPlanta';

export default function SeccionIdentificacion({ estado, errores, set }) {
  return (
    <section className="form-seccion" aria-label="Identificación">
      <h3 className="form-seccion-titulo">Identificación</h3>
      <div className="form-grid">
        <CampoFormulario id="f-nombre" etiqueta="Nombre común" requerido error={errores.nombreComun}>
          <input
            id="f-nombre"
            className="form-input"
            value={estado.nombreComun}
            onChange={(e) => set('nombreComun', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-cientifico" etiqueta="Nombre científico" requerido error={errores.nombreCientifico}>
          <input
            id="f-cientifico"
            className="form-input"
            value={estado.nombreCientifico}
            onChange={(e) => set('nombreCientifico', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-familia" etiqueta="Familia botánica" requerido error={errores.familia}>
          <input
            id="f-familia"
            className="form-input"
            value={estado.familia}
            onChange={(e) => set('familia', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-tipo" etiqueta="Tipo" requerido error={errores.tipo}>
          <select
            id="f-tipo"
            className="form-select"
            value={estado.tipo}
            onChange={(e) => set('tipo', e.target.value)}
            required
          >
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </CampoFormulario>
        <CampoFormulario id="f-origen" etiqueta="Origen" requerido error={errores.origen}>
          <input
            id="f-origen"
            className="form-input"
            value={estado.origen}
            onChange={(e) => set('origen', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-ejemplares" etiqueta="Ejemplares en el parque" error={errores.ejemplaresEnParque}>
          <input
            id="f-ejemplares"
            className="form-input"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="Ej. 12"
            value={estado.ejemplaresEnParque}
            onChange={(e) => set('ejemplaresEnParque', e.target.value)}
          />
        </CampoFormulario>
      </div>
    </section>
  );
}
