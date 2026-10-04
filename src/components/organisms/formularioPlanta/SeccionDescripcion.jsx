import CampoFormulario from '../../molecules/CampoFormulario';

export default function SeccionDescripcion({ estado, errores, set }) {
  return (
    <section className="form-seccion" aria-label="Descripción">
      <h3 className="form-seccion-titulo">Descripción</h3>
      <div className="form-grid">
        <CampoFormulario id="f-descripcion" etiqueta="Descripción general" requerido error={errores.descripcionGeneral}>
          <textarea
            id="f-descripcion"
            className="form-textarea"
            rows="3"
            value={estado.descripcionGeneral}
            onChange={(e) => set('descripcionGeneral', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-hojas" etiqueta="Hojas" requerido error={errores.descripcionHojas}>
          <textarea
            id="f-hojas"
            className="form-textarea"
            rows="3"
            value={estado.descripcionHojas}
            onChange={(e) => set('descripcionHojas', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-altura" etiqueta="Altura" requerido error={errores.altura}>
          <input
            id="f-altura"
            className="form-input"
            placeholder="Ej. 15 – 25 m"
            value={estado.altura}
            onChange={(e) => set('altura', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario id="f-usos" etiqueta="Usos tradicionales" error={errores.usos}>
          <textarea
            id="f-usos"
            className="form-textarea"
            rows={3}
            placeholder={'Uno por línea (ej. medicinal, sombra)'}
            value={estado.usos}
            onChange={(e) => set('usos', e.target.value)}
          />
        </CampoFormulario>
        <div className="form-grid form-grid-span2">
          <CampoFormulario id="f-impacto" etiqueta="Importancia ambiental" requerido error={errores.impacto}>
            <textarea
              id="f-impacto"
              className="form-textarea"
              rows={3}
              value={estado.impacto}
              onChange={(e) => set('impacto', e.target.value)}
              required
            />
          </CampoFormulario>
        </div>
      </div>
    </section>
  );
}
