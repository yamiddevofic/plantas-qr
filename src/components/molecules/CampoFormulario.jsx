import { Children, cloneElement } from 'react';

export default function CampoFormulario({ id, etiqueta, requerido = false, error, children }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`form-campo ${error ? 'form-campo-error' : ''}`}>
      <label className="form-etiqueta" htmlFor={id}>
        {etiqueta}
        {requerido && <span className="form-requerido" aria-hidden="true">*</span>}
      </label>
      {error
        ? Children.map(children, (child) =>
            cloneElement(child, { 'aria-describedby': errorId, 'aria-invalid': true })
          )
        : children}
      {error && <p className="form-error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}