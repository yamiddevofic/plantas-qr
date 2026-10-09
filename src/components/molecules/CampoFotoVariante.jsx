import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { LuCamera, LuImage, LuMonitor, LuMoon, LuSmartphone, LuUndo2 } from 'react-icons/lu';
import { FORMATOS } from '../../offline/fotos';
import CasillaFoto from './CasillaFoto';

const TEXTOS = {
  movil: { titulo: 'Móvil', ayuda: 'De día · principal en celulares', Icono: LuSmartphone },
  escritorio: { titulo: 'Escritorio', ayuda: 'De día · grande en computadores', Icono: LuMonitor },
  noche: { titulo: 'Noche', ayuda: 'Miniatura en modo noche', Icono: LuMoon },
};

/**
 * Una de las fotos del individuo (móvil 4:5, escritorio 16:9 o noche 4:5): vista
 * previa en su proporción real, tomar con la cámara encuadrada o elegir de la
 * galería (se recorta al centro). `pedirCamaraSistema` es un contador: cada vez
 * que cambia abre la cámara del sistema, para cuando la de la página no está disponible.
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

  return (
    <CasillaFoto
      clase={`foto-variante-${variante}`}
      titulo={titulo}
      Icono={Icono}
      formato={etiqueta}
      ayuda={ayuda}
      proporcion={proporcion}
      imagen={previa || actual}
      alt={`Foto ${titulo.toLowerCase()} ${previa ? 'nueva' : 'actual'} del árbol`}
      estado={nueva ? 'nueva' : null}
      esquina={nueva && (
        <button type="button" className="casilla-foto-esquina" onClick={onQuitar} aria-label={`Descartar la foto nueva: ${titulo}`} title="Descartar la foto nueva">
          <LuUndo2 aria-hidden="true" />
        </button>
      )}
    >
      <button type="button" className="casilla-foto-boton es-principal" onClick={onTomar} disabled={procesando}>
        <LuCamera aria-hidden="true" />
        <span>{procesando ? 'Procesando…' : 'Cámara'}</span>
      </button>
      <label className={`casilla-foto-boton${procesando ? ' inactivo' : ''}`}>
        <LuImage aria-hidden="true" />
        <span>Galería</span>
        <input type="file" accept="image/*" onChange={elegir} disabled={procesando} aria-label={`Elegir de la galería: ${titulo}`} />
      </label>
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
    </CasillaFoto>
  );
}

CampoFotoVariante.propTypes = {
  variante: PropTypes.oneOf(['movil', 'escritorio', 'noche']).isRequired,
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
