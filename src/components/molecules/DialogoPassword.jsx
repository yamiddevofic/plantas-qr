import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuLockKeyhole, LuX } from 'react-icons/lu';
import Boton from '../atoms/Boton';

/**
 * Diálogo de contraseña para acciones protegidas (regenerar códigos QR).
 * Se monta condicionalmente por el padre; al abrirse parte limpio y con
 * el foco en la contraseña.
 */
export default function DialogoPassword({
  titulo,
  descripcion,
  onCerrar,
  alConfirmar,
  cargando = false,
  error = null,
}) {
  const [password, setPassword] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function alTocarTecla(e) {
      if (e.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alTocarTecla);
    return () => window.removeEventListener('keydown', alTocarTecla);
  }, [onCerrar]);

  const enviar = (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    alConfirmar(password);
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        className="modal dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
      >
        <div className="modal-header">
          <LuLockKeyhole className="dialogo-icono" aria-hidden="true" />
          <h2 id="dialogo-titulo" className="modal-titulo">
            {titulo}
          </h2>
          <Boton variante="ghost" clase="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <LuX aria-hidden="true" />
          </Boton>
        </div>
        <p className="dialogo-descripcion">{descripcion}</p>

        <form onSubmit={enviar}>
          <div className="form-campo">
            <label className="form-etiqueta" htmlFor="dialogo-password">
              Contraseña de administrador
            </label>
            <input
              ref={inputRef}
              id="dialogo-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-acciones">
            <Boton variante="ghost" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton variante="primary" tipo="submit" disabled={cargando || !password.trim()}>
              {cargando ? 'Verificando…' : 'Continuar'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}

DialogoPassword.propTypes = {
  /** Encabezado del diálogo. */
  titulo: PropTypes.string.isRequired,
  /** Explicación de la acción protegida. */
  descripcion: PropTypes.string.isRequired,
  /** Cierra el diálogo (Escape, fondo o botón). */
  onCerrar: PropTypes.func.isRequired,
  /** Recibe la contraseña escrita para ejecutar la acción. */
  alConfirmar: PropTypes.func.isRequired,
  /** Operación en curso (deshabilita el envío). */
  cargando: PropTypes.bool,
  /** Mensaje de error (p. ej. contraseña incorrecta). */
  error: PropTypes.string,
};