import { useEffect, useState } from 'react';
import { fetchIndividuos, obtenerPlanta, obtenerQR } from '../../api';
import { aplicarSeo, seoDePlanta, SEO_INICIO } from '../../seo';
import PlantillaDetalle from '../templates/PlantillaDetalle';
import LeyendaEstados from '../molecules/LeyendaEstados';

export default function PaginaDetalle({ plantaId, arbolId = null }) {
  const [planta, setPlanta] = useState(null);
  const [qr, setQr] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);
  // Individuos con GPS de la especie: su mapa, su galería y la foto del hero.
  // Si la API falla, la ficha sigue sin ellos.
  const [coleccion, setColeccion] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    fetchIndividuos(plantaId, { signal: control.signal })
      .then(setColeccion)
      .catch((e) => {
        if (e.name !== 'AbortError') console.warn('Individuos no disponibles:', e.message);
      });
    return () => control.abort();
  }, [plantaId]);

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

  useEffect(() => {
    if (planta) aplicarSeo(seoDePlanta(planta));
    return () => aplicarSeo(SEO_INICIO);
  }, [planta]);

  return (
    <>
      <PlantillaDetalle
        cargando={cargando}
        error={error}
        planta={planta}
        qr={qr}
        coleccion={coleccion}
        arbolId={arbolId}
        onQrGenerado={setQr}
        onVerEstados={() => setLeyendaAbierta(true)}
      />
      {leyendaAbierta && <LeyendaEstados onCerrar={() => setLeyendaAbierta(false)} />}
    </>
  );
}