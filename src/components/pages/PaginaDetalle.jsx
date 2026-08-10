import { useEffect, useState } from 'react';
import { obtenerPlanta } from '../../api';
import PlantillaDetalle from '../templates/PlantillaDetalle';

export default function PaginaDetalle({ plantaId }) {
  const [planta, setPlanta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    obtenerPlanta(plantaId)
      .then((datos) => { if (!cancelado) setPlanta(datos); })
      .catch((e) => { if (!cancelado) setError(e.message); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [plantaId]);

  return <PlantillaDetalle cargando={cargando} error={error} planta={planta} />;
}