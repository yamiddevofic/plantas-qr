import { useEffect, useRef, useState } from 'react';
import { LuGlobe, LuHeadset, LuMail, LuMessageCircle } from 'react-icons/lu';
import GrupoMenu from '../molecules/GrupoMenu';
import ItemMenu from '../atoms/ItemMenu';

/**
 * Desplegable de contacto para soporte dentro de los menús laterales:
 * enlace al sitio chitaga.tech, WhatsApp (COL) y correo de soporte.
 * Se cierra al presionar fuera del desplegable o con Escape.
 */
export default function SeccionContacto() {
  const [abierto, setAbierto] = useState(false);
  const raizRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => {
      if (raizRef.current && !raizRef.current.contains(e.target)) setAbierto(false);
    };
    const alEscape = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('touchstart', alClicFuera, { passive: true });
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('touchstart', alClicFuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierto]);

  return (
    <div className="seccion-contacto" ref={raizRef}>
      <GrupoMenu titulo="Soporte">
        <ItemMenu
          icono={<LuHeadset aria-hidden="true" />}
          etiqueta={abierto ? 'Ocultar contacto' : 'Contacto'}
          descripcion="Ayuda y canales de soporte"
          expandido={abierto}
          controles="menu-contacto-contenido"
          onClick={() => setAbierto((v) => !v)}
        />
      </GrupoMenu>

      {abierto && (
        <div id="menu-contacto-contenido" className="menu-contacto">
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
    </div>
  );
}