import { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuEye, LuEyeOff, LuKeyRound } from 'react-icons/lu';

/**
 * Campo de contraseña con icono y botón para mostrarla u ocultarla (útil en el
 * celular, donde es fácil equivocarse al escribir). El botón no roba el foco.
 */
const CampoPassword = forwardRef(function CampoPassword(
  { id, valor, onCambiar, placeholder = 'Contraseña de administrador', invalido = false, autoFocus = false },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`campo-password${invalido ? ' invalido' : ''}`}>
      <LuKeyRound className="campo-password-icono" aria-hidden="true" />
      <input
        ref={ref}
        id={id}
        className="campo-password-input"
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        aria-invalid={invalido || undefined}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="campo-password-ver"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        {visible ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}
      </button>
    </div>
  );
});

CampoPassword.propTypes = {
  id: PropTypes.string.isRequired,
  valor: PropTypes.string.isRequired,
  onCambiar: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  /** Marca el campo en rojo (contraseña incorrecta). */
  invalido: PropTypes.bool,
  autoFocus: PropTypes.bool,
};

export default CampoPassword;
