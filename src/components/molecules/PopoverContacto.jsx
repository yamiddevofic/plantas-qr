import { useState } from 'react';
import { LuGlobe, LuHeadset, LuMail, LuMessageCircle } from 'react-icons/lu';

/**
 * Desplegable flotante de contacto para soporte, visible en la página de
 * inicio: un botón que expande un panel pequeño con chitaga.tech,
 * WhatsApp (COL) y el correo de soporte.
 */
export default function PopoverContacto() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="popover-contacto">
      {abierto && (
        <div
          id="popover-contacto-panel"
          className="popover-contacto-panel"
          role="group"
          aria-label="Contacto y soporte"
        >
          <p className="popover-contacto-titulo">Contacto y soporte</p>
          <a
            className="menu-contacto-enlace"
            href="https://chitaga.tech"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LuGlobe aria-hidden="true" />
            <span>
              <span className="menu-contacto-nombre">chitaga.tech</span>
              <span className="menu-contacto-meta">Comunidad tecnológica de Chitagá</span>
            </span>
          </a>
          <a
            className="menu-contacto-enlace"
            href="https://wa.me/573124673850"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LuMessageCircle aria-hidden="true" />
            <span>
              <span className="menu-contacto-nombre">WhatsApp +57 312 4673850</span>
              <span className="menu-contacto-meta">COL · mensajes y llamadas</span>
            </span>
          </a>
          <a className="menu-contacto-enlace" href="mailto:team@chitaga.tech">
            <LuMail aria-hidden="true" />
            <span>
              <span className="menu-contacto-nombre">team@chitaga.tech</span>
              <span className="menu-contacto-meta">Correo de soporte</span>
            </span>
          </a>
        </div>
      )}

      <button
        type="button"
        className="popover-contacto-boton"
        aria-expanded={abierto}
        aria-controls="popover-contacto-panel"
        aria-label={abierto ? 'Ocultar contacto y soporte' : 'Contacto y soporte'}
        onClick={() => setAbierto((v) => !v)}
      >
        <LuHeadset aria-hidden="true" />
        Contacto
      </button>
    </div>
  );
}