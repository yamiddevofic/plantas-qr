import { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LuCamera, LuCherry, LuImage, LuLeaf, LuLink, LuMoon, LuStar, LuTrash2, LuTreeDeciduous, LuUndo2, LuX } from 'react-icons/lu';
import useModal from '../../hooks/useModal';
import { listaImagenes } from '../../constantes';
import { comprimirFoto } from '../../offline/fotos';
import Boton from '../atoms/Boton';
import CasillaFoto from '../molecules/CasillaFoto';

let contador = 0;

/* Fotos de un solo uso: cada una tiene un sitio fijo en la app (no entran al
   carrusel). La de día es la «Principal» del carrusel. Se previsualizan en
   cuadrado para que las cuatro casillas queden parejas; no se recortan al
   guardar (cada sitio las encuadra con object-fit). */
const UNICAS = [
  { clave: 'noche', campo: 'imagenNoche', titulo: 'Noche', Icono: LuMoon, ayuda: 'Portada en la galería en modo noche.' },
  { clave: 'hoja', campo: 'imagenHoja', titulo: 'Hoja', Icono: LuLeaf, ayuda: 'En la ficha, junto a las hojas.', conCredito: true },
  { clave: 'tallo', campo: 'imagenTallo', titulo: 'Tallo', Icono: LuTreeDeciduous, ayuda: 'En la ficha, junto al tronco.', conCredito: true },
  { clave: 'fruto', campo: 'imagenFruto', titulo: 'Fruto', Icono: LuCherry, ayuda: 'En la ficha, junto a los frutos.', conCredito: true },
];

/** Fotos que llevan crédito: las de la ficha (pueden venir de internet). */
const CON_CREDITO = UNICAS.filter((u) => u.conCredito).map((u) => u.clave);

/** { hoja|tallo|fruto: { texto, enlace } } siempre completo, para editar y comparar. */
function normalizarCreditos(creditos) {
  return Object.fromEntries(CON_CREDITO.map((clave) => [clave, {
    texto: creditos?.[clave]?.texto ?? '',
    enlace: creditos?.[clave]?.enlace ?? '',
  }]));
}

/** Mismo criterio que el servidor: el enlace, si va, es https:// y necesita la fuente escrita. */
function errorDeCredito({ texto, enlace }) {
  const t = texto.trim();
  const e = enlace.trim();
  if (!e) return null;
  let url = null;
  try {
    url = new URL(e);
  } catch {
    // no es una URL
  }
  if (url?.protocol !== 'https:') return 'El enlace debe empezar por https://';
  if (!t) return 'Escribe también la fuente o el autor.';
  return null;
}

/**
 * Fuente de una foto que no es del proyecto: quién la tomó o de dónde salió (con
 * su licencia si la tiene) y el enlace a la original. Plegada si está vacía.
 */
function FuenteFoto({ titulo, credito, onCambiar }) {
  const id = useId();
  const [abierta, setAbierta] = useState(Boolean(credito.texto || credito.enlace));
  const error = errorDeCredito(credito);

  if (!abierta) {
    return (
      <div className="casilla-foto-fuente">
        <button type="button" className="casilla-foto-fuente-abrir" onClick={() => setAbierta(true)}>
          <LuLink aria-hidden="true" />
          Agregar fuente <span>(si no es propia)</span>
        </button>
      </div>
    );
  }
  return (
    <div className="casilla-foto-fuente" role="group" aria-label={`Fuente de la foto: ${titulo}`}>
      <label className="casilla-foto-campo" htmlFor={`${id}-texto`}>Fuente o autor</label>
      <input
        id={`${id}-texto`}
        type="text"
        value={credito.texto}
        maxLength={160}
        placeholder="Ej.: Ana Gómez · iNaturalist · CC BY"
        onChange={(e) => onCambiar({ ...credito, texto: e.target.value })}
      />
      <label className="casilla-foto-campo" htmlFor={`${id}-enlace`}>Enlace a la original <span>(opcional)</span></label>
      <input
        id={`${id}-enlace`}
        type="url"
        inputMode="url"
        value={credito.enlace}
        maxLength={500}
        placeholder="https://…"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onCambiar({ ...credito, enlace: e.target.value })}
      />
      {error && <p id={`${id}-error`} className="casilla-foto-fuente-error">{error}</p>}
    </div>
  );
}

FuenteFoto.propTypes = {
  titulo: PropTypes.string.isRequired,
  credito: PropTypes.shape({ texto: PropTypes.string, enlace: PropTypes.string }).isRequired,
  onCambiar: PropTypes.func.isRequired,
};

/**
 * Una foto de un solo uso: tomarla con la cámara del celular, elegirla de la
 * galería, quitarla o deshacer el cambio. `nueva` es un Blob (sin guardar), null
 * (se quitará al guardar) o undefined (sin cambios: se ve `actual`).
 */
function FotoUnica({
  titulo, ayuda, Icono, actual, nueva, procesando, credito = null, onCredito, onArchivo, onQuitar, onDeshacer,
}) {
  const previa = useMemo(() => (nueva ? URL.createObjectURL(nueva) : ''), [nueva]);
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa); }, [previa]);
  const cambio = nueva !== undefined;

  const elegir = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (archivo) onArchivo(archivo);
  };

  let esquina = null;
  if (cambio) {
    esquina = (
      <button type="button" className="casilla-foto-esquina" onClick={onDeshacer} aria-label={`Deshacer el cambio: ${titulo}`} title="Deshacer">
        <LuUndo2 aria-hidden="true" />
      </button>
    );
  } else if (actual) {
    esquina = (
      <button type="button" className="casilla-foto-esquina es-peligro" onClick={onQuitar} aria-label={`Quitar la foto: ${titulo}`} title="Quitar">
        <LuTrash2 aria-hidden="true" />
      </button>
    );
  }

  return (
    <CasillaFoto
      titulo={titulo}
      Icono={Icono}
      ayuda={ayuda}
      proporcion={1}
      imagen={previa || actual}
      alt={`${titulo}: foto ${previa ? 'nueva' : 'actual'}`}
      estado={nueva ? 'nueva' : nueva === null ? 'quitar' : null}
      esquina={esquina}
      // La fuente solo tiene sentido si hay foto (y no se va a quitar).
      pie={credito && nueva !== null && (previa || actual)
        ? <FuenteFoto titulo={titulo} credito={credito} onCambiar={onCredito} />
        : null}
    >
      <label className={`casilla-foto-boton es-principal${procesando ? ' inactivo' : ''}`}>
        <LuCamera aria-hidden="true" />
        <span>{procesando ? 'Procesando…' : 'Cámara'}</span>
        <input type="file" accept="image/*" capture="environment" onChange={elegir} disabled={procesando} aria-label={`Tomar foto: ${titulo}`} />
      </label>
      <label className={`casilla-foto-boton${procesando ? ' inactivo' : ''}`}>
        <LuImage aria-hidden="true" />
        <span>Galería</span>
        <input type="file" accept="image/*" onChange={elegir} disabled={procesando} aria-label={`Elegir de la galería: ${titulo}`} />
      </label>
    </CasillaFoto>
  );
}

FotoUnica.propTypes = {
  titulo: PropTypes.string.isRequired,
  ayuda: PropTypes.string.isRequired,
  Icono: PropTypes.elementType.isRequired,
  actual: PropTypes.string,
  nueva: PropTypes.instanceOf(Blob),
  procesando: PropTypes.bool,
  /** Fuente de la foto (solo hoja, tallo y fruto). */
  credito: PropTypes.shape({ texto: PropTypes.string, enlace: PropTypes.string }),
  onCredito: PropTypes.func,
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
export default function EditorFotosEspecie({
  planta, enLinea, onClose, onGuardar, iniciales = null, unicasIniciales = null, creditosIniciales = null,
}) {
  const dialogoRef = useModal(onClose);
  // Cada elemento: { clave, ref } para fotos que ya tenía o { clave, archivo } para nuevas.
  const [fotos, setFotos] = useState(() => iniciales ?? listaImagenes(planta).map((ref) => ({ clave: ref, ref })));
  const [procesando, setProcesando] = useState(false);
  // Fotos de un solo uso que cambian: { noche|hoja|tallo|fruto: Blob (nueva) | null (quitar) }.
  const [unicas, setUnicas] = useState(() => unicasIniciales ?? {});
  const [procesandoUnica, setProcesandoUnica] = useState(null);
  // Fuente de las fotos de hoja, tallo y fruto.
  const [creditos, setCreditos] = useState(() => normalizarCreditos(creditosIniciales ?? planta.creditos));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const previas = useMemo(() => {
    const urls = {};
    for (const f of fotos) if (f.archivo) urls[f.clave] = URL.createObjectURL(f.archivo);
    return urls;
  }, [fotos]);
  useEffect(() => () => Object.values(previas).forEach((u) => URL.revokeObjectURL(u)), [previas]);

  const base = iniciales ? iniciales.map((f) => f.ref) : listaImagenes(planta);
  // Al seguir un cambio guardado sin enviar, los créditos se vuelven a mandar siempre.
  const cambiaCreditos = Boolean(creditosIniciales)
    || JSON.stringify(creditos) !== JSON.stringify(normalizarCreditos(planta.creditos));
  const cambios = fotos.length !== base.length || fotos.some((f, i) => f.archivo || f.ref !== base[i])
    || Object.keys(unicas).length > 0 || cambiaCreditos;

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
    const invalido = CON_CREDITO.find((clave) => errorDeCredito(creditos[clave]));
    if (invalido) {
      setError(`Revisa la fuente de la foto de ${invalido}: ${errorDeCredito(creditos[invalido])}`);
      return;
    }
    setEnviando(true);
    const nuevas = fotos.filter((f) => f.archivo);
    const orden = fotos.map((f) => (f.archivo ? `nueva:${nuevas.indexOf(f)}` : f.ref));
    try {
      const limpios = Object.fromEntries(CON_CREDITO.map((clave) => [clave, {
        texto: creditos[clave].texto.trim(),
        enlace: creditos[clave].enlace.trim(),
      }]));
      await onGuardar(orden, nuevas.map((f) => f.archivo), unicas, cambiaCreditos ? limpios : null);
    } catch (e) {
      if (!e.cancelado) setError(e.sinRed ? 'Sin conexión. Las fotos de especies solo se guardan con internet.' : e.message);
      setEnviando(false);
    }
  }

  const nuevasEnCarrusel = fotos.filter((f) => f.archivo).length;

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-fotos" role="dialog" aria-modal="true" aria-labelledby="fotos-titulo" ref={dialogoRef} tabIndex={-1}>
        <header className="modal-header">
          <div>
            <p className="fotos-antetitulo">Fotos de la especie</p>
            <h2 id="fotos-titulo" className="modal-titulo">{planta.nombre.comun}</h2>
            <p className="fotos-subtitulo">{planta.nombre.cientifico}</p>
          </div>
          <Boton variante="ghost" clase="modal-cerrar" onClick={onClose} aria-label="Cerrar">
            <LuX aria-hidden="true" />
          </Boton>
        </header>

        <section className="fotos-seccion" aria-labelledby="fotos-carrusel-titulo">
          <div className="fotos-seccion-cabecera">
            <div>
              <h3 id="fotos-carrusel-titulo" className="fotos-seccion-titulo">
                Carrusel
                <span className="fotos-seccion-cuenta">
                  {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
                  {nuevasEnCarrusel > 0 && ` · ${nuevasEnCarrusel} ${nuevasEnCarrusel === 1 ? 'nueva' : 'nuevas'}`}
                </span>
              </h3>
              <p className="fotos-seccion-ayuda">La «Principal» es la portada de la ficha y de la galería de día.</p>
            </div>
            <div className="fotos-agregar">
              <label className={`casilla-foto-boton es-principal${procesando ? ' inactivo' : ''}`}>
                <LuCamera aria-hidden="true" />
                <span>{procesando ? 'Procesando…' : 'Cámara'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={agregar} disabled={procesando} aria-label="Tomar foto para el carrusel" />
              </label>
              <label className={`casilla-foto-boton${procesando ? ' inactivo' : ''}`}>
                <LuImage aria-hidden="true" />
                <span>Galería</span>
                <input type="file" accept="image/*" multiple onChange={agregar} disabled={procesando} aria-label="Elegir fotos de la galería para el carrusel" />
              </label>
            </div>
          </div>

          {fotos.length === 0 ? (
            <p className="fotos-vacio">Esta especie aún no tiene fotos en el carrusel.</p>
          ) : (
            <ul className="fotos-rejilla">
              {fotos.map((f, i) => (
                <li key={f.clave} className={`fotos-item${i === 0 ? ' es-principal' : ''}`}>
                  <img src={f.archivo ? previas[f.clave] : f.ref} alt={`Foto ${i + 1} de ${planta.nombre.comun}`} />
                  {f.archivo && <span className="casilla-foto-estado es-nueva fotos-item-nueva">Nueva</span>}
                  <button
                    type="button"
                    className="casilla-foto-esquina es-peligro"
                    onClick={() => quitar(f.clave)}
                    aria-label={`Quitar la foto ${i + 1}`}
                    title="Quitar"
                  >
                    <LuTrash2 aria-hidden="true" />
                  </button>
                  {i === 0 ? (
                    <span className="fotos-item-principal">
                      <LuStar aria-hidden="true" />
                      <span className="fotos-item-texto">Principal</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="fotos-item-destacar"
                      onClick={() => hacerPrincipal(f.clave)}
                      aria-label={`Destacar la foto ${i + 1}: usarla como principal`}
                    >
                      <LuStar aria-hidden="true" />
                      <span className="fotos-item-texto">Destacar</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="fotos-seccion" aria-labelledby="fotos-fijas-titulo">
          <div className="fotos-seccion-cabecera">
            <div>
              <h3 id="fotos-fijas-titulo" className="fotos-seccion-titulo">Fotos con un lugar fijo</h3>
              <p className="fotos-seccion-ayuda">
                Cada una se ve en un solo sitio y no entra al carrusel. Si una foto no es del
                proyecto (por ejemplo, de internet), anota su fuente: se muestra en la ficha.
              </p>
            </div>
          </div>
          <div className="fotos-fijas">
            {UNICAS.map(({ clave, campo, conCredito, ...textos }) => (
              <FotoUnica
                key={clave}
                {...textos}
                credito={conCredito ? creditos[clave] : null}
                onCredito={(valor) => setCreditos((prev) => ({ ...prev, [clave]: valor }))}
                actual={planta[campo] || ''}
                nueva={unicas[clave]}
                procesando={procesandoUnica === clave}
                onArchivo={(archivo) => ponerUnica(clave, archivo)}
                onQuitar={() => quitarUnica(clave)}
                onDeshacer={() => deshacerUnica(clave)}
              />
            ))}
          </div>
        </section>

        {!enLinea && (
          <p className="form-ayuda" role="status">
            Sin conexión: los cambios de fotos se guardan en este dispositivo y se envían cuando vuelva
            internet (ahí se pedirá la contraseña de administrador).
          </p>
        )}
        {error && <p className="form-error form-error-bloque" role="alert">{error}</p>}

        <footer className="form-acciones fotos-pie">
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
  /** Créditos del cambio guardado sin enviar. */
  creditosIniciales: PropTypes.object,
};
