export default function EstadoBox({ icono, titulo, texto, children, clase = '', alerta = false }) {
  return (
    <div className={`state-box ${clase}`.trim()} {...(alerta ? { role: 'alert' } : {})}>
      <p className="state-icon" aria-hidden="true">{icono}</p>
      <h2 className="state-title">{titulo}</h2>
      {texto && <p className="state-text">{texto}</p>}
      {children}
    </div>
  );
}