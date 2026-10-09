import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LuCamera, LuCherry, LuImage, LuLeaf, LuMoon, LuStar, LuTrash2, LuX } from 'react-icons/lu';
import useModal from '../../hooks/useModal';
import { listaImagenes } from '../../constantes';
import { comprimirFoto } from '../../offline/fotos';
import Boton from '../atoms/Boton';

let contador = 0;

/* Fotos de un solo uso: cada una tiene un sitio fijo en la app (no entran al
   carrusel). La de día es la «Principal» de arriba. */
const UNICAS = [
  {
    clave: 'noche', campo: 'imagenNoche', titulo: 'Portada de noche', Icono: LuMoon, proporcion: 3 / 4,
    ayuda: 'Se ve en la galería cuando la página está en modo noche. De día se usa la «Principal».',
  },
  {
    clave: 'hoja', campo: 'imagenHoja', titulo: 'Hoja', Icono: LuLeaf, proporcion: 1,
    ayuda: 'Se ve en la ficha, junto a la descripción de las hojas.',
  },
  {
    clave: 'fruto', campo: 'imagenFruto', titulo: 'Fruto', Icono: LuCherry, proporcion: 1,
    ayuda: 'Se ve en la ficha, junto a los frutos. Si la sacas de internet, anota de dónde y verifica que se pueda usar.',
  },
];

/**
 * Una foto de un solo uso: vista previa, tomarla con la cámara del celular,
 * elegirla de la galería o quitarla. `nueva` es un Blob (sin guardar), null (se
 * quitará al guardar) o undefined (sin cambios: se ve `actual`).
 */
function FotoUnica({ titulo, ayuda, Icono, proporcion, actual, nueva, procesando, onArchivo, onQuitar, onDeshacer }) {
  const previa = useMemo(() => (nueva ? URL.createObjectURL(nueva) : ''), [nueva]);
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa); }, [previa]);
  const imagen = nueva === null ? '' : previa || actual;
  const cambio = nueva !== undefined;

  const elegir = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (archivo) onArchivo(archivo);
  };

  return (
    <div className="foto-variante">
      <div className="foto-variante-cabecera">
        <Icono aria-hidden="true" />
        <strong>{titulo}</strong>
        {nueva && <span className="foto-variante-nueva">Nueva</span>}
        {nueva === null && <span className="foto-variante-nueva">Se quitará</span>}
      </div>
      <p className="foto-variante-ayuda">{ayuda}</p>
      <div className="foto-variante-previa" style={{ aspectRatio: proporcion }}>
        {imagen ? (
          <img src={imagen} alt={`${titulo}: foto ${previa ? 'nueva' : 'actual'}`} />
        ) : (
          <span className="foto-variante-vacia" aria-hidden="true">
            <Icono />
            Sin foto
          </span>
        )}
      </div>
      <div className="foto-variante-acciones">
        <label className="btn btn-ghost form-archivo">
          <LuCamera aria-hidden="true" className="btn-lupa-icono" />
          {procesando ? 'Procesando…' : 'Tomar foto'}
          <input type="file" accept="image/*" capture="environment" onChange={elegir} disabled={procesando} aria-label={`Tomar foto: ${titulo}`} />
        </label>
        <label className="btn btn-ghost form-archivo">
          <LuImage aria-hidden="true" className="btn-lupa-icono" />
          Galería
          <input type="file" accept="image/*" onChange={elegir} disabled={procesando} aria-label={`Elegir de la galería: ${titulo}`} />
        </label>
        {cambio ? (
          <button type="button" className="btn btn-ghost" onClick={onDeshacer}>Deshacer</button>
        ) : (
          actual && <button type="button" className="btn btn-ghost" onClick={onQuitar}>Quitar</button>
        )}
      </div>
    </div>
  );
}

FotoUnica.propTypes = {
  titulo: PropTypes.string.isRequired,
  ayuda: PropTypes.string.isRequired,
  Icono: PropTypes.elementType.isRequired,
  proporcion: PropTypes.number.isRequired,
  actual: PropTypes.string,
  nueva: PropTypes.instanceOf(Blob),
  procesando: PropTypes.bool,
  onArchivo: PropTypes.func.isRequired,
  onQuitar: PropTypes.func.isRequired,
  onDeshacer: PropTypes.func.isRequired,
};

/**
 * Modal para ordenar, quitar y agregar fotos de una especie. La primera foto es
 * la principal (tarjeta de la galería y portada de la ficha).
 * `onGuardar(orden, archivosNuevos)` devuelve una promesa. Sin conexión se puede
 * guardar igual: la página lo deja en el dispositivo y lo envía cuando vuelva internet.
 * `iniciales` (opcional) arranca el editor desde un cambio ya guardado sin enviar:
 * lista de { clave, ref } (foto que ya tenía) o { clave, archivo } (foto nueva).
 */
export default function EditorFotosEspecie({ planta, enLinea, onClose, onGuardar, iniciales = null, unicasIniciales = null }) {
  const dialogoRef = useModal(onClose);
  // Cada elemento: { clave, ref } para fotos que ya tenía o { clave, archivo } para nuevas.
  const [fotos, setFotos] = useState(() => iniciales ?? listaImagenes(planta).map((ref) => ({ clave: ref, ref })));
  const [procesando, setProcesando] = useState(false);
  // Fotos de un solo uso que cambian: { noche|hoja|fruto: Blob (nueva) | null (quitar) }.
  const [unicas, setUnicas] = useState(() => unicasIniciales ?? {});
  const [procesandoUnica, setProcesandoUnica] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const previas = useMemo(() => {
    const urls = {};
    for (const f of fotos) if (f.archivo) urls[f.clave] = URL.createObjectURL(f.archivo);
    return urls;
  }, [fotos]);
  useEffect(() => () => Object.values(previas).forEach((u) => URL.revokeObjectURL(u)), [previas]);

  const base = iniciales ? iniciales.map((f) => f.ref) : listaImagenes(planta);
  const cambios = fotos.length !== base.length || fotos.some((f, i) => f.archivo || f.ref !== base[i])
    || Object.keys(unicas).length > 0;

  async function ponerUnica(clave, archivo) {
    setProcesandoUnica(clave);
    const blob = await comprimirFoto(archivo);
    setUnicas((prev) => ({ ...prev, [clave]: blob }));
    setProcesandoUnica(null);
  }
  const quitarUnica = (clave) => setUnicas((prev) => ({ ...prev, [clave]: null }));
  const deshacerUnica = (clave) => setUnicas((prev) => {
    const resto = { ...prev };
    delete resto[clave];
    return resto;
  });

  async function agregar(e) {
    const archivos = [...(e.target.files || [])];
    e.target.value = '';
    if (!archivos.length) return;
    setProcesando(true);
    const nuevas = [];
    for (const archivo of archivos) {
      contador += 1;
      nuevas.push({ clave: `nueva-${contador}`, archivo: await comprimirFoto(archivo) });
    }
    setFotos((prev) => [...prev, ...nuevas]);
    setProcesando(false);
  }

  const hacerPrincipal = (clave) => setFotos((prev) => {
    const elegida = prev.find((f) => f.clave === clave);
    return [elegida, ...prev.filter((f) => f.clave !== clave)];
  });
  const quitar = (clave) => setFotos((prev) => prev.filter((f) => f.clave !== clave));

  async function guardar() {
    setError(null);
    setEnviando(true);
    const nuevas = fotos.filter((f) => f.archivo);
    const orden = fotos.map((f) => (f.archivo ? `nueva:${nuevas.indexOf(f)}` : f.ref));
    try {
      await onGuardar(orden, nuevas.map((f) => f.archivo), unicas);
    } catch (e) {
      if (!e.cancelado) setError(e.sinRed ? 'Sin conexión. Las fotos de especies solo se guardan con internet.' : e.message);
      setEnviando(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="fotos-titulo" ref={dialogoRef} tabIndex={-1}>
        <header className="modal-header">
          <div>
            <h2 id="fotos-titulo" className="modal-titulo">{planta.nombre.comun}</h2>
            <p className="fotos-subtitulo">{planta.nombre.cientifico}</p>
          </div>
          <Boton variante="ghost" clase="modal-cerrar" onClick={onClose} aria-label="Cerrar">
            <LuX aria-hidden="true" />
          </Boton>
        </header>

        <p className="form-ayuda">La foto destacada (la marcada «Principal») aparece en la galería y como portada de la ficha. Toca «Destacar» en otra para cambiarla.</p>

        {fotos.length === 0 ? (
          <p className="fotos-vacio">Esta especie no tiene fotos.</p>
        ) : (
          <ul className="fotos-rejilla">
            {fotos.map((f, i) => (
              <li key={f.clave} className={`fotos-item${i === 0 ? ' es-principal' : ''}`}>
                <div className="fotos-item-foto">
                  <img src={f.archivo ? previas[f.clave] : f.ref} alt={`Foto ${i + 1} de ${planta.nombre.comun}`} />
                  {f.archivo && <span className="fotos-nueva">Nueva</span>}
                </div>
                <div className="fotos-item-acciones">
                  {i === 0 ? (
                    <span className="fotos-estado-principal">
                      <LuStar aria-hidden="true" />
                      Principal
                    </span>
                  ) : (
                    <button type="button" className="fotos-accion" onClick={() => hacerPrincipal(f.clave)} aria-label={`Destacar la foto ${i + 1}: usarla como principal`}>
                      <LuStar aria-hidden="true" />
                      Destacar
                    </button>
                  )}
                  <button type="button" className="fotos-accion fotos-accion-quitar" onClick={() => quitar(f.clave)} aria-label={`Quitar la foto ${i + 1}`}>
                    <LuTrash2 aria-hidden="true" />
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="form-acciones-linea">
          <label className="btn btn-ghost form-archivo">
            <LuCamera aria-hidden="true" className="btn-lupa-icono" />
            {procesando ? 'Procesando…' : 'Tomar foto'}
            <input type="file" accept="image/*" capture="environment" onChange={agregar} disabled={procesando} />
          </label>
          <label className="btn btn-ghost form-archivo">
            <LuImage aria-hidden="true" className="btn-lupa-icono" />
            Elegir de la galería
            <input type="file" accept="image/*" multiple onChange={agregar} disabled={procesando} />
          </label>
        </div>

        <h3 className="fotos-unicas-titulo">Fotos con un lugar fijo</h3>
        <p className="form-ayuda">Cada una va en un solo sitio de la app, no en el carrusel.</p>
        <div className="fotos-unicas">
          {UNICAS.map(({ clave, campo, ...textos }) => (
            <FotoUnica
              key={clave}
              {...textos}
              actual={planta[campo] || ''}
              nueva={unicas[clave]}
              procesando={procesandoUnica === clave}
              onArchivo={(archivo) => ponerUnica(clave, archivo)}
              onQuitar={() => quitarUnica(clave)}
              onDeshacer={() => deshacerUnica(clave)}
            />
          ))}
        </div>

        {!enLinea && (
          <p className="form-ayuda" role="status">
            Sin conexión: los cambios de fotos se guardan en este dispositivo y se envían cuando vuelva
            internet (ahí se pedirá la contraseña de administrador).
          </p>
        )}
        {error && <p className="form-error form-error-bloque" role="alert">{error}</p>}

        <footer className="form-acciones">
          <Boton variante="ghost" onClick={onClose} disabled={enviando}>Cancelar</Boton>
          <Boton variante="primary" onClick={guardar} disabled={enviando || procesando || Boolean(procesandoUnica) || !cambios}>
            {enviando ? 'Guardando…' : (enLinea ? 'Guardar fotos' : 'Guardar en este dispositivo')}
          </Boton>
        </footer>
      </div>
    </div>
  );
}

EditorFotosEspecie.propTypes = {
  planta: PropTypes.object.isRequired,
  enLinea: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGuardar: PropTypes.func.isRequired,
  /** Cambio de fotos ya guardado sin enviar, para seguir editándolo. */
  iniciales: PropTypes.arrayOf(PropTypes.shape({
    clave: PropTypes.string.isRequired,
    ref: PropTypes.string,
    archivo: PropTypes.object,
  })),
  /** Fotos de un solo uso del cambio guardado sin enviar: Blob (nueva) o null (quitar). */
  unicasIniciales: PropTypes.objectOf(PropTypes.instanceOf(Blob)),
};
