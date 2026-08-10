import { useState } from 'react';
import { eliminarPlanta, generarQR } from '../../api';
import CarruselImagenes from './CarruselImagenes';
import TarjetaHechos from '../molecules/TarjetaHechos';
import AccionesTarjeta from '../molecules/AccionesTarjeta';

export default function TarjetaPlanta({ planta, qr, onDeleted, onQRRegenerated, onEdit }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${planta.nombre.comun}"?`)) return;
    setLoading(true);
    try {
      await eliminarPlanta(planta._id);
      onDeleted(planta._id);
    } catch (e) {
      alert('Error: ' + e.message);
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const nuevoQR = await generarQR(planta._id);
      onQRRegenerated(planta._id, nuevoQR);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!qr?.imagen) return;
    const a = document.createElement('a');
    a.href = qr.imagen;
    a.download = `QR-${planta.nombre.comun}.png`;
    a.click();
  };

  return (
    <article className={`planta-card ${loading ? 'loading' : ''}`}>
      <CarruselImagenes planta={planta} />

      <div className="card-body">
        <h3 className="card-nombre">{planta.nombre.comun}</h3>
        <p className="card-cientifico">{planta.nombre.cientifico}</p>

        <TarjetaHechos
          datos={[
            { icono: '🌱', texto: planta.familia && `Familia ${planta.familia}` },
            { icono: '📏', texto: planta.altura },
          ]}
        />

        <div className="card-qr-section">
          {qr?.imagen ? (
            <img key={qr.url} src={qr.imagen} alt="" className="card-qr-img" width={96} height={96} decoding="async" />
          ) : (
            <div className="card-qr-placeholder">Sin QR</div>
          )}
          <div className="card-qr-single">
            {qr?.url && (
              <p className="card-qr-url" title={qr.url}>
                {qr.url}
              </p>
            )}
            <a
              href={`#/planta/${planta._id}`}
              className="card-link"
            >
              Ver ficha del árbol
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <AccionesTarjeta
        nombreComun={planta.nombre.comun}
        tieneQR={Boolean(qr?.imagen)}
        cargando={loading}
        onRegenerar={handleRegenerate}
        onDescargar={handleDownload}
        onEditar={() => onEdit(planta)}
        onEliminar={handleDelete}
      />
    </article>
  );
}