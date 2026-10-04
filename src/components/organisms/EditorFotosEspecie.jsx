import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LuCamera, LuImage, LuStar, LuTrash2, LuX } from 'react-icons/lu';
import useModal from '../../hooks/useModal';
import { listaImagenes } from '../../constantes';
import { comprimirFoto } from '../../offline/fotos';
import Boton from '../atoms/Boton';

let contador = 0;

/**
 * Modal para ordenar, quitar y agregar fotos de una especie. La primera foto es
 * la principal (tarjeta de la galería y portada de la ficha).
 * `onGuardar(orden, archivosNuevos)` devuelve una promesa.
 */
export default function EditorFotosEspecie({ planta, enLinea, onClose, onGuardar }) {
  const dialogoRef = useModal(onClose);
  // Cada elemento: { clave, ref } para fotos que ya tenía o { clave, archivo } para nuevas.
  const [fotos, setFotos] = useState(() => listaImagenes(planta).map((ref) => ({ clave: ref, ref })));
  const [procesando, setProcesando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const previas = useMemo(() => {
    const urls = {};
    for (const f of fotos) if (f.archivo) urls[f.clave] = URL.createObjectURL(f.archivo);
    return urls;
  }, [fotos]);
  useEffect(() => () => Object.values(previas).forEach((u) => URL.revokeObjectURL(u)), [previas]);

  const cambios = fotos.length !== listaImagenes(planta).length
    || fotos.some((f, i) => f.archivo || f.ref !== listaImagenes(planta)[i]);

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
      await onGuardar(orden, nuevas.map((f) => f.archivo));
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

        {!enLinea && <p className="form-error" role="status">Sin conexión: puedes preparar los cambios, pero se guardan solo con internet.</p>}
        {error && <p className="form-error form-error-bloque" role="alert">{error}</p>}

        <footer className="form-acciones">
          <Boton variante="ghost" onClick={onClose} disabled={enviando}>Cancelar</Boton>
          <Boton variante="primary" onClick={guardar} disabled={enviando || procesando || !cambios || !enLinea}>
            {enviando ? 'Guardando…' : 'Guardar fotos'}
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
};
