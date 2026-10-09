import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { LuCheck, LuRefreshCw, LuRotateCcw, LuSwitchCamera, LuX } from 'react-icons/lu';
import { FORMATOS, recortarRegion, regionCentrada } from '../../offline/fotos';

const TITULOS = {
  movil: 'Foto para móvil',
  escritorio: 'Foto para escritorio',
  noche: 'Foto de noche',
};

/**
 * Cámara a pantalla completa con el encuadre de la variante (4:5 o 16:9) marcado
 * en vivo. El video se muestra entero (contain) y el recuadro es la región más
 * grande con esa proporción dentro del sensor: lo que se ve dentro es
 * exactamente lo que se guarda, con la mayor resolución posible.
 *
 * Si el navegador no da acceso a la cámara, `onSinCamara` permite caer en la
 * cámara del sistema (input de archivo) que recorta al centro.
 */
export default function CamaraEncuadre({ variante, onCapturar, onCerrar, onSinCamara }) {
  const { proporcion, etiqueta, lado } = FORMATOS[variante];
  const videoRef = useRef(null);
  const escenarioRef = useRef(null);
  const flujoRef = useRef(null);
  const [frontal, setFrontal] = useState(false);
  const [error, setError] = useState(() => (navigator.mediaDevices?.getUserMedia
    ? null
    : 'Este navegador no permite usar la cámara desde la página.'));
  const [listo, setListo] = useState(false);
  const [marco, setMarco] = useState(null);
  const [captura, setCaptura] = useState(null);
  const [previa, setPrevia] = useState('');
  const [vertical, setVertical] = useState(() => window.innerHeight > window.innerWidth);

  // Abre la cámara (trasera por defecto) pidiendo la mayor resolución disponible.
  useEffect(() => {
    let cancelado = false;
    if (!navigator.mediaDevices?.getUserMedia) return undefined;
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: frontal ? 'user' : 'environment' },
        width: { ideal: 4096 },
        height: { ideal: 4096 },
      },
    }).then((flujo) => {
      if (cancelado) {
        flujo.getTracks().forEach((t) => t.stop());
        return;
      }
      flujoRef.current = flujo;
      const video = videoRef.current;
      video.srcObject = flujo;
      video.play().catch(() => {});
    }).catch((e) => {
      if (cancelado) return;
      setError(e.name === 'NotAllowedError'
        ? 'No hay permiso para usar la cámara. Actívalo en el navegador o usa la cámara del sistema.'
        : 'No se pudo abrir la cámara de la página.');
    });
    return () => {
      cancelado = true;
      flujoRef.current?.getTracks().forEach((t) => t.stop());
      flujoRef.current = null;
    };
  }, [frontal]);

  // Ubica el recuadro sobre el video: misma región que se recortará del sensor.
  const medir = useCallback(() => {
    const video = videoRef.current;
    const escenario = escenarioRef.current;
    if (!video?.videoWidth || !escenario) return;
    const { clientWidth: ew, clientHeight: eh } = escenario;
    const escala = Math.min(ew / video.videoWidth, eh / video.videoHeight);
    const x0 = (ew - video.videoWidth * escala) / 2;
    const y0 = (eh - video.videoHeight * escala) / 2;
    const region = regionCentrada(video.videoWidth, video.videoHeight, proporcion);
    setMarco({
      left: x0 + region.x * escala,
      top: y0 + region.y * escala,
      width: region.ancho * escala,
      height: region.alto * escala,
    });
    setVertical(window.innerHeight > window.innerWidth);
  }, [proporcion]);

  useLayoutEffect(() => {
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [medir]);

  // Bloquea el scroll de la página mientras la cámara está abierta.
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, []);

  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa); }, [previa]);

  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  async function disparar() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const region = regionCentrada(video.videoWidth, video.videoHeight, proporcion);
    const blob = await recortarRegion(video, region, lado);
    if (!blob) return;
    setCaptura(blob);
    setPrevia(URL.createObjectURL(blob));
  }

  function repetir() {
    setCaptura(null);
    setPrevia('');
  }

  return createPortal(
    <div className="camara" role="dialog" aria-modal="true" aria-label={`${TITULOS[variante]} (${etiqueta})`}>
      <header className="camara-barra">
        <button type="button" className="camara-boton" onClick={onCerrar} aria-label="Cerrar la cámara">
          <LuX aria-hidden="true" />
        </button>
        <p className="camara-titulo">
          {TITULOS[variante]} <span>{etiqueta}</span>
        </p>
        <button
          type="button"
          className="camara-boton"
          onClick={() => {
            setListo(false);
            setMarco(null);
            setFrontal((f) => !f);
          }}
          aria-label="Cambiar de cámara"
          disabled={Boolean(captura) || Boolean(error)}
        >
          <LuSwitchCamera aria-hidden="true" />
        </button>
      </header>

      <div className="camara-escenario" ref={escenarioRef}>
        <video
          ref={videoRef}
          className={`camara-video${frontal ? ' espejo' : ''}`}
          playsInline
          muted
          onLoadedMetadata={() => { setListo(true); medir(); }}
        />
        {listo && marco && !captura && (
          <div className="camara-marco" style={marco} aria-hidden="true">
            <span className="camara-tercios" />
          </div>
        )}
        {previa && <img className="camara-previa" src={previa} alt="Foto tomada" />}
        {!listo && !error && <p className="camara-estado">Abriendo la cámara…</p>}
        {error && (
          <div className="camara-estado camara-error" role="alert">
            <p>{error}</p>
            {onSinCamara && (
              <button type="button" className="btn btn-primary" onClick={onSinCamara}>
                Usar la cámara del sistema
              </button>
            )}
          </div>
        )}
        {listo && !captura && variante === 'escritorio' && vertical && (
          <p className="camara-consejo">Gira el teléfono para una foto horizontal más nítida.</p>
        )}
      </div>

      <footer className="camara-controles">
        {captura ? (
          <>
            <button type="button" className="camara-accion" onClick={repetir}>
              <LuRotateCcw aria-hidden="true" />
              Repetir
            </button>
            <button type="button" className="camara-accion camara-accion-principal" onClick={() => onCapturar(captura)}>
              <LuCheck aria-hidden="true" />
              Usar foto
            </button>
          </>
        ) : (
          <button
            type="button"
            className="camara-disparador"
            onClick={disparar}
            disabled={!listo}
            aria-label="Tomar foto"
          >
            <span aria-hidden="true" />
          </button>
        )}
        {!captura && error && onSinCamara && (
          <button type="button" className="camara-accion" onClick={onSinCamara}>
            <LuRefreshCw aria-hidden="true" />
            Cámara del sistema
          </button>
        )}
      </footer>
    </div>,
    document.body,
  );
}

CamaraEncuadre.propTypes = {
  /** 'movil' o 'noche' (vertical 4:5) o 'escritorio' (horizontal 16:9). */
  variante: PropTypes.oneOf(['movil', 'escritorio', 'noche']).isRequired,
  /** Recibe el JPEG recortado al aceptar la foto. */
  onCapturar: PropTypes.func.isRequired,
  onCerrar: PropTypes.func.isRequired,
  /** Alternativa cuando la cámara de la página no está disponible. */
  onSinCamara: PropTypes.func,
};
