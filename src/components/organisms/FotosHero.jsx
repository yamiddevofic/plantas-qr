import { useEffect, useState } from 'react';

/* Cada foto puede traer una versión vertical para móvil y su propio encuadre
   (object-position) en pantallas anchas y en móvil vertical. */
const FOTOS = [
  {
    id: 'aerea',
    src: '/parque-2.jpg',
    webp: '/parque-2-800.webp 800w, /parque-2.webp 1200w',
    movil: '/parque-mobil-1.jpeg',
    encuadre: '50% 40%',
    encuadreMovil: '50% 30%',
  },
  {
    id: 'plaza',
    src: '/parque-1.jpg',
    encuadre: '50% 55%',
    encuadreMovil: '50% 50%',
  },
  {
    id: 'paisaje',
    src: '/parque-1.jpeg',
    encuadre: '40% 60%',
    encuadreMovil: '30% 50%',
  },
];

const INTERVALO_MS = 6500;

const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fondo fotográfico del hero del inicio: las fotos del parque pasan solas con
 * un fundido lento y un acercamiento suave. Se detiene con la pestaña oculta y
 * no avanza solo si el usuario pidió reducir el movimiento. Cada foto se monta
 * cuando le falta poco para salir, así la primera carga solo pide una. El velo
 * que da contraste al texto vive en inicio.css.
 */
export default function FotosHero() {
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
    if (sinMovimiento()) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) ir((activa + 1) % FOTOS.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [activa]);

  return (
    <>
      <div className="hero-fotos" aria-hidden="true">
        {FOTOS.slice(0, cargadas).map((foto, i) => (
          <picture
            key={foto.id}
            className={`hero-foto${i === activa ? ' activa' : ''}`}
            style={{ '--encuadre': foto.encuadre, '--encuadre-movil': foto.encuadreMovil }}
          >
            {foto.movil && (
              <source media="(max-width: 767px) and (orientation: portrait)" srcSet={foto.movil} />
            )}
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
            onClick={() => setActiva(i)}
          />
        ))}
      </div>
    </>
  );
}
