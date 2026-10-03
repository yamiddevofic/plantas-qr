import { useState } from 'react';
import PropTypes from 'prop-types';
import { LuArrowLeft, LuLockKeyhole } from 'react-icons/lu';
import { verificarAdmin } from '../../api';
import {
  guardarPasswordSesion,
  hayHuella,
  passwordSesion,
  recordarHuella,
  verificarHuella,
} from '../../offline/sesionAdmin';
import Boton from '../atoms/Boton';

/**
 * Pide la contraseña de administrador antes de mostrar una página de gestión.
 * Con conexión la verifica el servidor; sin conexión, la huella guardada en
 * el dispositivo tras la última verificación correcta.
 */
export default function PuertaAdmin({ titulo, children }) {
  const [abierta, setAbierta] = useState(() => Boolean(passwordSesion()));
  const [password, setPassword] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState(null);

  if (abierta) return children;

  async function entrar(e) {
    e.preventDefault();
    if (!password) return;
    setVerificando(true);
    setError(null);
    let ok = false;
    let sinRed = !navigator.onLine;
    if (!sinRed) {
      try {
        await verificarAdmin(password);
        ok = true;
        recordarHuella(password);
      } catch (err) {
        // fetch rechaza con TypeError cuando no hay red; un 401 trae mensaje del servidor.
        if (err instanceof TypeError) sinRed = true;
        else setError(err.message || 'Contraseña incorrecta');
      }
    }
    if (sinRed) {
      if (!hayHuella()) {
        setError('Sin conexión. La primera vez debes entrar con internet; después también funcionará sin señal.');
      } else if (await verificarHuella(password)) {
        ok = true;
      } else {
        setError('Contraseña incorrecta');
      }
    }
    setVerificando(false);
    if (ok) {
      guardarPasswordSesion(password);
      setAbierta(true);
    }
  }

  return (
    <div className="app">
      <header className="individuos-cabecera">
        <a className="individuos-volver" href="#/galeria">
          <LuArrowLeft aria-hidden="true" />
          Catálogo
        </a>
      </header>
      <main id="app-main" className="puerta-admin">
        <span className="puerta-admin-icono" aria-hidden="true"><LuLockKeyhole /></span>
        <h1 className="puerta-admin-titulo">{titulo}</h1>
        <p className="puerta-admin-texto">Esta sección es para administradores. Ingresa la contraseña para continuar.</p>
        <form className="puerta-admin-form" onSubmit={entrar}>
          <label className="visually-hidden" htmlFor="puerta-password">Contraseña de administrador</label>
          <input
            id="puerta-password"
            className="form-input"
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña de administrador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <Boton variante="primary" tipo="submit" disabled={verificando || !password}>
            {verificando ? 'Verificando…' : 'Entrar'}
          </Boton>
        </form>
      </main>
    </div>
  );
}

PuertaAdmin.propTypes = {
  /** Nombre de la sección protegida. */
  titulo: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
