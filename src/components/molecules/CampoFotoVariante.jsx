import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { LuCamera, LuImage, LuMonitor, LuSmartphone } from 'react-icons/lu';
import { FORMATOS } from '../../offline/fotos';

const TEXTOS = {
  movil: { titulo: 'Móvil', ayuda: 'Vertical · imagen principal en celulares', Icono: LuSmartphone },
  escritorio: { titulo: 'Escritorio', ayuda: 'Horizontal · imagen grande en computadores', Icono: LuMonitor },
};

/**
 * Una de las dos fotos del individuo (móvil 4:5 o escritorio 16:9): vista previa
 * en su proporción real, tomar con la cámara encuadrada o elegir de la galería
 * (se recorta al centro). `pedirCamaraSistema` es un contador: cada vez que
 * cambia abre la cámara del sistema, para cuando la de la página no está disponible.
 */
export default function CampoFotoVariante({
  variante, actual = '', nueva = null, procesando = false, pedirCamaraSistema = 0,
  onTomar, onArchivo, onQuitar,
}) {
  const { titulo, ayuda, Icono } = TEXTOS[variante];
  const { etiqueta, proporcion } = FORMATOS[variante];
  const camaraSistemaRef = useRef(null);
  const previa = useMemo(() => (nueva ? URL.createObjectURL(nueva) : ''), [nueva]);
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa); }, [previa]);

  useEffect(() => {
    if (pedirCamaraSistema) camaraSistemaRef.current?.click();
  }, [pedirCamaraSistema]);

  const elegir = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (archivo) onArchivo(archivo);
  };

  const imagen = previa || actual;

  return (
    <div className={`foto-variante foto-variante-${variante}`}>
      <div className="foto-variante-cabecera">
        <Icono aria-hidden="true" />
        <strong>{titulo}</strong>
        <span className="foto-variante-formato">{etiqueta}</span>
        {nueva && <span className="foto-variante-nueva">Nueva</span>}
      </div>
      <p className="foto-variante-ayuda">{ayuda}</p>

      <div className="foto-variante-previa" style={{ aspectRatio: proporcion }}>
        {imagen ? (
          <img src={imagen} alt={`Foto ${titulo.toLowerCase()} ${previa ? 'nueva' : 'actual'} del árbol`} />
        ) : (
          <span className="foto-variante-vacia" aria-hidden="true">
            <Icono />
            {etiqueta}
          </span>
        )}
      </div>

      <div className="foto-variante-acciones">
        <button type="button" className="btn btn-primary" onClick={onTomar} disabled={procesando}>
          <LuCamera aria-hidden="true" className="btn-lupa-icono" />
          {procesando ? 'Procesando…' : 'Tomar foto'}
        </button>
        <label className="btn btn-ghost form-archivo">
          <LuImage aria-hidden="true" className="btn-lupa-icono" />
          Galería
          <input type="file" accept="image/*" onChange={elegir} disabled={procesando} />
        </label>
        {nueva && (
          <button type="button" className="btn btn-ghost" onClick={onQuitar}>Quitar</button>
        )}
        {/* Cámara del sistema: solo se abre por código cuando la de la página falla. */}
        <input
          ref={camaraSistemaRef}
          className="foto-variante-sistema"
          type="file"
          accept="image/*"
          capture="environment"
          tabIndex={-1}
          aria-hidden="true"
          onChange={elegir}
        />
      </div>
    </div>
  );
}

CampoFotoVariante.propTypes = {
  variante: PropTypes.oneOf(['movil', 'escritorio']).isRequired,
  /** URL de la foto ya guardada en el servidor. */
  actual: PropTypes.string,
  /** Foto nueva aún sin guardar. */
  nueva: PropTypes.instanceOf(Blob),
  procesando: PropTypes.bool,
  pedirCamaraSistema: PropTypes.number,
  onTomar: PropTypes.func.isRequired,
  onArchivo: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
};
