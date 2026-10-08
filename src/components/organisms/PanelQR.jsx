import { LuDownload } from 'react-icons/lu';
import Boton from '../atoms/Boton';
import { IconoQr } from '../atoms/IconosInicio';
import useRevelar from '../../hooks/useRevelar';

/** Código QR de la especie: vista previa, descarga e ID copiable. */
export default function PanelQR({ planta, qr, copiado, onCopiar, enlaceCopiado, onCopiarEnlace, descargando, onDescargar, error, exito }) {
  const [ref, visible] = useRevelar({ umbral: 0.2 });
  return (
    <section
      ref={ref}
      className={`detalle-qr revelar${visible ? ' revelado' : ''}`}
      aria-labelledby="ficha-qr-titulo"
    >
      <div className="detalle-qr-codigo">
        {qr ? (
          <img src={qr.imagen} alt={`Código QR de ${planta.nombre.comun}`} width={112} height={112} />
        ) : (
          <IconoQr />
        )}
        {/* Haz de escaneo, como en el emblema del inicio. */}
        <span className="detalle-qr-haz" aria-hidden="true" />
      </div>
      <div className="detalle-qr-info">
        <h2 id="ficha-qr-titulo" className="inicio-eyebrow">Código QR</h2>
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
          <button type="button" className="detalle-id-copiar" onClick={onCopiarEnlace} title="Copiar el enlace para compartir esta ficha">
            {enlaceCopiado ? '✓ Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>
        <p className="detalle-qr-id">ID <code>{planta._id}</code></p>
        {error && <p className="form-error" role="alert" aria-live="assertive">{error}</p>}
        {exito && <p className="detalle-qr-exito" role="status">{exito}</p>}
      </div>
    </section>
  );
}
