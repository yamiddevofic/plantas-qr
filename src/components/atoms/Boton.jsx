export default function Boton({ variante = 'primary', clase = '', tipo = 'button', enlace = false, href, children, ...props }) {
  const clases = `btn btn-${variante} ${clase}`.trim();
  if (enlace) {
    return (
      <a href={href} className={clases} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type={tipo} className={clases} {...props}>
      {children}
    </button>
  );
}