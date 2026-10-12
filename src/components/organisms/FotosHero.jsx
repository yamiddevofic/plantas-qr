import { useEffect, useState, useSyncExternalStore } from 'react';

/* Pantallas anchas: carrusel de fotos del parque. Cada una con su encuadre. */
const FOTOS = [
  {
    id: 'aerea',
    src: '/parque-2.jpg',
    webp: '/parque-2-800.webp 800w, /parque-2.webp 1200w',
    encuadre: '50% 40%',
  },
  { id: 'plaza', src: '/parque-1.jpg', encuadre: '50% 55%' },
  { id: 'paisaje', src: '/parque-1.jpeg', encuadre: '40% 60%' },
];

/* Móvil vertical: una sola foto, vertical, de la plaza. */
const MOVIL = '(max-width: 767px) and (orientation: portrait)';
const FOTO_MOVIL = '/parque-mobil-1.jpeg';

const INTERVALO_MS = 6500;

function useMedia(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener('change', avisar);
      return () => mq.removeEventListener('change', avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

/**
 * Fondo fotográfico del hero del inicio. En móvil vertical es una sola foto;
 * en pantallas anchas las fotos del parque pasan solas con un fundido lento y
 * un acercamiento suave (se detiene con la pestaña oculta y no avanza solo si
 * el usuario pidió reducir el movimiento). Cada foto se monta cuando le falta
 * poco para salir. El velo que da contraste al texto vive en inicio.css.
 */
export default function FotosHero() {
  const esMovil = useMedia(MOVIL);
  const sinMovimiento = useMedia('(prefers-reduced-motion: reduce)');
  const [activa, setActiva] = useState(0);
  /* Se montan la activa y la siguiente, para que esta ya esté descargada cuando le toque. */
  const [cargadas, setCargadas] = useState(2);

  const ir = (i) => {
    setActiva(i);
    setCargadas((n) => Math.max(n, Math.min(i + 2, FOTOS.length)));
  };

  /* Cada cambio de foto reinicia la cuenta (también al elegir una con los
     puntos). Con la pestaña oculta la cuenta sigue, pero no se avanza. */
  useEffect(() => {
    if (esMovil || sinMovimiento) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) ir((activa + 1) % FOTOS.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [activa, esMovil, sinMovimiento]);

  if (esMovil) {
    return (
      <div className="hero-fotos" aria-hidden="true">
        <picture className="hero-foto activa" style={{ '--encuadre': '50% 30%' }}>
          <img src={FOTO_MOVIL} alt="" width="494" height="619" fetchPriority="high" decoding="async" />
        </picture>
      </div>
    );
  }

  return (
    <>
      <div className="hero-fotos" aria-hidden="true">
        {FOTOS.slice(0, cargadas).map((foto, i) => (
          <picture
            key={foto.id}
            className={`hero-foto${i === activa ? ' activa' : ''}`}
            style={{ '--encuadre': foto.encuadre }}
          >
            {foto.webp && <source type="image/webp" srcSet={foto.webp} sizes="100vw" />}
            <img src={foto.src} alt="" decoding="async" fetchPriority={i === 0 ? 'high' : 'low'} />
          </picture>
        ))}
      </div>

      <div className="hero-fotos-puntos" role="group" aria-label="Fotos del parque">
        {FOTOS.map((foto, i) => (
          <button
            key={foto.id}
            type="button"
            className={`hero-fotos-punto${i === activa ? ' activa' : ''}`}
            aria-label={`Ver foto ${i + 1} de ${FOTOS.length}`}
            aria-pressed={i === activa}
            onClick={() => ir(i)}
          />
        ))}
      </div>
    </>
  );
}
