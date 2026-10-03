import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { LuDownload, LuX } from 'react-icons/lu';
import {
  esIOS,
  estadoInstalacion,
  lanzarInstalacion,
  suscribirInstalacion,
} from '../../offline/instalacion';
import Boton from '../atoms/Boton';
import ItemMenu from '../atoms/ItemMenu';

const INSTRUCCIONES_IOS = [
  'Abre esta página en Safari (en Chrome de iPhone no se puede instalar).',
  'Toca el botón Compartir (el cuadro con la flecha hacia arriba).',
  'Baja y elige "Agregar a pantalla de inicio".',
];
const INSTRUCCIONES_GENERALES = [
  'Si abriste el enlace desde WhatsApp, Instagram o Facebook, ábrelo en Chrome (Android) o Safari (iPhone).',
  'Android: menú ⋮ → "Instalar aplicación" o "Agregar a la pantalla principal".',
  'Computador: icono de instalar a la derecha de la barra de direcciones de Chrome o Edge.',
  'Si no aparece, recarga la página una vez y vuelve a intentarlo.',
];

/**
 * Ítem de menú "Instalar app". Donde el navegador lo permite abre el diálogo
 * nativo; si no (iPhone, navegador dentro de otra app…), muestra los pasos.
 * Se oculta cuando la app ya se está usando instalada.
 */
export default function ItemInstalarApp({ onCerrarMenu }) {
  const { puedeLanzar, instalada } = useSyncExternalStore(suscribirInstalacion, estadoInstalacion);
  const [ayuda, setAyuda] = useState(false);
  if (instalada) return null;

  const ios = esIOS();
  const pasos = ios ? INSTRUCCIONES_IOS : INSTRUCCIONES_GENERALES;

  async function instalar() {
    if (puedeLanzar) {
      onCerrarMenu?.();
      await lanzarInstalacion();
    } else {
      // El menú sigue abierto: al cerrarse desmontaría este componente y su ventana.
      setAyuda(true);
    }
  }

  return (
    <>
      <ItemMenu
        icono={<LuDownload aria-hidden="true" />}
        etiqueta="Instalar app"
        descripcion="Úsala desde tu pantalla de inicio, también sin internet"
        onClick={instalar}
      />
      {/* Portal: el menú lateral se anima con transform y recortaría un overlay fijo. */}
      {ayuda && createPortal(
        (
          <div
            className="overlay instalar-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setAyuda(false); }}
          >
            <div className="modal dialogo" role="dialog" aria-modal="true" aria-labelledby="instalar-titulo">
              <div className="modal-header">
                <LuDownload className="dialogo-icono" aria-hidden="true" />
                <h2 id="instalar-titulo" className="modal-titulo">Instalar PlantaQR</h2>
                <Boton variante="ghost" clase="modal-cerrar" onClick={() => setAyuda(false)} aria-label="Cerrar">
                  <LuX aria-hidden="true" />
                </Boton>
              </div>
              <ol className="instalar-pasos">
                {pasos.map((paso) => <li key={paso}>{paso}</li>)}
              </ol>
              <div className="form-acciones">
                <Boton variante="primary" onClick={() => setAyuda(false)}>Entendido</Boton>
              </div>
            </div>
          </div>
        ),
        document.body,
      )}
    </>
  );
}

ItemInstalarApp.propTypes = {
  /** Cierra el menú lateral antes de abrir el diálogo nativo. */
  onCerrarMenu: PropTypes.func,
};
