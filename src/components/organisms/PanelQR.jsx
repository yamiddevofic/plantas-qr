import { LuDownload } from 'react-icons/lu';
import Boton from '../atoms/Boton';

/** ID copiable, QR de la especie y botón de descarga. */
export default function PanelQR({ planta, qr, totalSitios, copiado, onCopiar, descargando, onDescargar, error, exito }) {
  return (
    <div className="detalle-qr">
      <div className="detalle-id">
        <span className="detalle-id-etiqueta">ID de la especie</span>
        <code className="detalle-id-valor">{planta._id}</code>
        <button
          type="button"
          className="detalle-id-copiar"
          onClick={onCopiar}
          title="Copiar ID al portapapeles"
        >
          {copiado ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
      {qr && (
        <img
          className="detalle-qr-imagen"
          src={qr.imagen}
          alt={`Código QR de ${planta.nombre.comun}`}
          width={96}
          height={96}
        />
      )}
      <div className="detalle-qr-info">
        <Boton variante="primary" onClick={onDescargar} disabled={descargando}>
          <LuDownload aria-hidden="true" className="btn-lupa-icono" />
          {descargando ? 'Preparando…' : 'Descargar QR'}
        </Boton>
        <p className="detalle-qr-nota">
          El código QR de este árbol enlaza a su ficha para que las
          visitas lo escaneen y conozcan la especie.
          {totalSitios > 0 && (
            <>
              {' '}Se han registrado {totalSitios} {totalSitios === 1 ? 'individuo' : 'individuos'}
              {' '}de esta especie en distintas zonas del parque.
            </>
          )}
        </p>
        {error && <p className="form-error" role="alert" aria-live="assertive">{error}</p>}
        {exito && <p className="detalle-qr-exito" role="status">{exito}</p>}
      </div>
    </div>
  );
}
