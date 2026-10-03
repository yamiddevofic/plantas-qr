import { LuDownload, LuQrCode } from 'react-icons/lu';
import Boton from '../atoms/Boton';

/** Código QR de la especie: vista previa, descarga e ID copiable. */
export default function PanelQR({ planta, qr, copiado, onCopiar, descargando, onDescargar, error, exito }) {
  return (
    <section className="detalle-qr" aria-labelledby="ficha-qr-titulo">
      <div className="detalle-qr-codigo">
        {qr ? (
          <img src={qr.imagen} alt={`Código QR de ${planta.nombre.comun}`} width={112} height={112} />
        ) : (
          <LuQrCode aria-hidden="true" />
        )}
      </div>
      <div className="detalle-qr-info">
        <h3 id="ficha-qr-titulo" className="detalle-qr-titulo">Código QR</h3>
        <p className="detalle-qr-nota">
          Lleva a esta ficha. Imprímelo junto al árbol para que las visitas lo escaneen.
        </p>
        <div className="detalle-qr-acciones">
          <Boton variante="primary" onClick={onDescargar} disabled={descargando}>
            <LuDownload aria-hidden="true" className="btn-lupa-icono" />
            {descargando ? 'Preparando…' : 'Descargar QR'}
          </Boton>
          <button type="button" className="detalle-id-copiar" onClick={onCopiar} title="Copiar el ID de la especie">
            {copiado ? '✓ ID copiado' : 'Copiar ID'}
          </button>
        </div>
        <p className="detalle-qr-id">ID <code>{planta._id}</code></p>
        {error && <p className="form-error" role="alert" aria-live="assertive">{error}</p>}
        {exito && <p className="detalle-qr-exito" role="status">{exito}</p>}
      </div>
    </section>
  );
}
