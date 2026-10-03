import PropTypes from 'prop-types';
import { LuCloudOff, LuRefreshCw } from 'react-icons/lu';
import Boton from '../atoms/Boton';

const ETIQUETA = { crear: 'Nuevo', editar: 'Cambio', eliminar: 'Eliminación', foto: 'Foto' };

/**
 * Estado de la conexión y de los cambios guardados sin enviar. Los que el
 * servidor rechazó se listan aparte para poder descartarlos.
 */
export default function BannerSincronizacion({ enLinea, cola, sincronizando, onSincronizar, onDescartar }) {
  const porEnviar = cola.filter((op) => !op.error);
  const rechazados = cola.filter((op) => op.error);
  if (enLinea && cola.length === 0) return null;

  const nombre = (op) => op.datos?.codigoArbol ?? op.codigoArbol ?? op.id;

  return (
    <div className="sincronizacion" role="region" aria-label="Sincronización">
      {!enLinea && (
        <p className="sincronizacion-estado" role="status">
          <LuCloudOff aria-hidden="true" />
          <span>
            <strong>Sin conexión.</strong> Puedes seguir registrando y editando árboles: se guardan en
            este dispositivo y se envían cuando vuelva internet.
          </span>
        </p>
      )}

      {porEnviar.length > 0 && (
        <div className="sincronizacion-pendientes">
          <p role="status">
            {porEnviar.length} {porEnviar.length === 1 ? 'cambio pendiente' : 'cambios pendientes'} de enviar
            {' '}({porEnviar.map((op) => `${ETIQUETA[op.tipo]} ${nombre(op)}`).join(', ')}).
          </p>
          {enLinea && (
            <Boton variante="primary" onClick={onSincronizar} disabled={sincronizando}>
              <LuRefreshCw aria-hidden="true" className="btn-lupa-icono" />
              {sincronizando ? 'Enviando…' : 'Enviar ahora'}
            </Boton>
          )}
        </div>
      )}

      {rechazados.length > 0 && (
        <ul className="sincronizacion-rechazos">
          {rechazados.map((op) => (
            <li key={op.id}>
              <span>
                <strong>{nombre(op)}</strong>: el servidor no aceptó este cambio — {op.error}
              </span>
              <Boton variante="ghost" onClick={() => onDescartar(op.id)}>Descartar</Boton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

BannerSincronizacion.propTypes = {
  enLinea: PropTypes.bool.isRequired,
  cola: PropTypes.arrayOf(PropTypes.object).isRequired,
  sincronizando: PropTypes.bool,
  onSincronizar: PropTypes.func.isRequired,
  onDescartar: PropTypes.func.isRequired,
};
