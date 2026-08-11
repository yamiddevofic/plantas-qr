import { useEffect, useState } from 'react';
import { obtenerPlanta, obtenerQR } from '../../api';
import PlantillaDetalle from '../templates/PlantillaDetalle';

export default function PaginaDetalle({ plantaId }) {
  const [planta, setPlanta] = useState(null);
  const [qr, setQr] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    Promise.allSettled([obtenerPlanta(plantaId), obtenerQR(plantaId)])
      .then(([plantaRes, qrRes]) => {
        if (cancelado) return;
        if (plantaRes.status === 'fulfilled') {
          setPlanta(plantaRes.value);
          if (qrRes.status === 'fulfilled') setQr(qrRes.value);
        } else {
          setError(plantaRes.reason?.message || 'No se pudo cargar la ficha');
        }
      })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [plantaId]);

  return <PlantillaDetalle cargando={cargando} error={error} planta={planta} qr={qr} onQrGenerado={setQr} />;
}