export default function CampoFormulario({ id, etiqueta, requerido = false, error, children }) {
  return (
    <div className={`form-campo ${error ? 'form-campo-error' : ''}`}>
      <label className="form-etiqueta" htmlFor={id}>
        {etiqueta}
        {requerido && <span className="form-requerido" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}