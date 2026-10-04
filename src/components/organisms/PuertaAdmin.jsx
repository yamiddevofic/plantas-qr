import { useState } from 'react';
import PropTypes from 'prop-types';
import { verificarAdmin } from '../../api';
import {
  guardarPasswordSesion,
  hayHuella,
  passwordSesion,
  recordarHuella,
  verificarHuella,
} from '../../offline/sesionAdmin';
import Boton from '../atoms/Boton';
import { IconoCandado, IconoFlecha, IconoVolver } from '../atoms/IconosInicio';
import CampoPassword from '../molecules/CampoPassword';
import PaisajeHero from './PaisajeHero';

// En el celular no se enfoca solo: el teclado taparía la tarjeta al entrar.
const PANTALLA_TACTIL = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

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
  // Contraseña incorrecta: la tarjeta se sacude (sin volver a montarse, para no
  // perder el foco ni el "mostrar contraseña").
  const [sacudir, setSacudir] = useState(false);

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
    if (!ok) setSacudir(true);
    if (ok) {
      guardarPasswordSesion(password);
      setAbierta(true);
    }
  }

  return (
    <div className="puerta">
      <PaisajeHero />
      <a className="puerta-volver" href="#/galeria">
        <IconoVolver />
        Catálogo
      </a>
      <main id="app-main" className="puerta-contenido">
        <div
          className={`puerta-tarjeta${sacudir ? ' sacudir' : ''}`}
          onAnimationEnd={(e) => { if (e.animationName === 'sacudir') setSacudir(false); }}
        >
          <span className="puerta-icono" aria-hidden="true"><IconoCandado /></span>
          <p className="inicio-eyebrow">Acceso de administración</p>
          <h1 className="puerta-titulo">{titulo}</h1>
          <p className="puerta-texto">Esta sección es para administradores. Ingresa la contraseña para continuar.</p>
          <form className="puerta-form" onSubmit={entrar}>
            <label className="visually-hidden" htmlFor="puerta-password">Contraseña de administrador</label>
            <CampoPassword
              id="puerta-password"
              valor={password}
              onCambiar={(v) => { setPassword(v); setError(null); }}
              invalido={Boolean(error)}
              autoFocus={!PANTALLA_TACTIL}
            />
            {error && <p className="form-error puerta-error" role="alert">{error}</p>}
            <Boton variante="primary" tipo="submit" clase="puerta-entrar" disabled={verificando || !password}>
              {verificando ? 'Verificando…' : 'Entrar'}
              {!verificando && <IconoFlecha />}
            </Boton>
          </form>
          <p className="puerta-nota">Si ya entraste antes en este dispositivo, también funciona sin conexión.</p>
        </div>
      </main>
    </div>
  );
}

PuertaAdmin.propTypes = {
  /** Nombre de la sección protegida. */
  titulo: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
