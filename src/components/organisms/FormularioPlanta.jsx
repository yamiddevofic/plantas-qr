import { useEffect, useRef, useState } from 'react';
import { crearPlanta, actualizarPlanta, buscarPlanta } from '../../api';
import { normalizarUsos, PLACEHOLDER } from '../../constantes';
import CampoFormulario from '../molecules/CampoFormulario';
import DialogoPassword from '../molecules/DialogoPassword';
import Boton from '../atoms/Boton';

const TIPOS = ['árbol', 'arbusto', 'hierba', 'piedra', 'planta acuática', 'cactus', 'otro', 'palma', 'árbol (conífera)', 'árbol / arbusto según poda', 'arbusto / arbolito', 'arbusto bajo'];
const ESTADOS_CONSERVACION = [
  'en peligro',
  'vulnerable',
  'casi amenazado',
  'preocupación menor',
  'datos insuficientes',
  'extinto en estado silvestre',
  'extinto',
  'no amenazada',
  'no amenazada (cultivada)',
  'no amenazada, aunque cada vez más escasa en áreas urbanas',
  'vulnerable (según catálogo plantaqr del parque)',
  'no amenazada / ampliamente distribuida en los Andes',
  'preocupación menor (LC)',
  'preocupación menor (LC) / Ampliamente cultivada',
  'no determinado',
];

function inicialEstado(planta) {
  return {
    nombreComun: planta?.nombre?.comun ?? '',
    nombreCientifico: planta?.nombre?.cientifico ?? '',
    familia: planta?.familia ?? '',
    origen: planta?.origen ?? '',
    tipo: planta?.tipo ?? TIPOS[0],
    descripcionGeneral: planta?.descripcion?.general ?? '',
    descripcionHojas: planta?.descripcion?.hojas ?? '',
    altura: planta?.altura ?? '',
    usos: normalizarUsos(planta?.usos).join(', '),
    impacto: planta?.impacto ?? '',
    estadoConservacion: planta?.estadoConservacion ?? ESTADOS_CONSERVACION[0],
    latitud: planta?.ubicacion?.latitud ?? '',
    longitud: planta?.ubicacion?.longitud ?? '',
    ubicacionDescripcion: planta?.ubicacion?.descripcion ?? '',
  };
}

export default function FormularioPlanta({ planta, onClose, onGuardado }) {
  const [estado, setEstado] = useState(() => inicialEstado(planta));
  const [plantaEditable, setPlantaEditable] = useState(planta || null);
  const [imagenFile, setImagenFile] = useState(null);
  const [previa, setPrevia] = useState(planta?.imagen || '');
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensajeError, setMensajeError] = useState(null);
  const [idBusqueda, setIdBusqueda] = useState(planta?._id || '');
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [mensajeId, setMensajeId] = useState(null);
  const [passwordDialogoAbierto, setPasswordDialogoAbierto] = useState(false);
  const [passwordCargando, setPasswordCargando] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const datosPendientes = useRef(null);
  const dialogoRef = useRef(null);

  const esEdicion = Boolean(plantaEditable);
  const titulo = esEdicion ? `Editar ${plantaEditable.nombre.comun}` : 'Agregar nueva especie';

  async function cargarPorId(e) {
    e.preventDefault();
    const id = idBusqueda.trim();
    if (!id) {
      setMensajeId({ tipo: 'error', texto: 'Escribe el ID de una especie para buscarla.' });
      return;
    }
    setCargandoFicha(true);
    setMensajeId(null);
    try {
      const encontrada = await buscarPlanta(id);
      if (!encontrada) {
        setMensajeId({ tipo: 'error', texto: 'No existe una especie con ese ID.' });
      } else {
        setPlantaEditable(encontrada);
        setEstado(inicialEstado(encontrada));
        setPrevia(encontrada.imagen || '');
        setImagenFile(null);
        setErrores({});
        setIdBusqueda(encontrada._id);
        setMensajeId({
          tipo: 'ok',
          texto: `${encontrada.nombre.comun} cargada. Modifica los datos y guarda los cambios.`,
        });
      }
    } catch (error) {
      setMensajeId({ tipo: 'error', texto: error.message });
    } finally {
      setCargandoFicha(false);
    }
  }

  useEffect(() => {
    dialogoRef.current?.focus();
  }, []);

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const prev = {
      bodyPos: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    const bloquearFuera = (e) => {
      if (dialogoRef.current && !dialogoRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', bloquearFuera, { passive: false });
    document.addEventListener('touchmove', bloquearFuera, { passive: false });

    return () => {
      body.style.position = prev.bodyPos;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.overflow = prev.bodyOverflow;
      html.style.overflow = prev.htmlOverflow;
      document.removeEventListener('wheel', bloquearFuera);
      document.removeEventListener('touchmove', bloquearFuera);
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    function onTab(e) {
      if (e.key !== 'Tab') return;
      const contenido = dialogoRef.current;
      if (!contenido) return;
      const enfocables = [...contenido.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      const visibles = enfocables.filter((el) => !el.disabled && el.offsetParent !== null);
      if (visibles.length === 0) return;
      const primero = visibles[0];
      const ultimo = visibles[visibles.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onTab);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keydown', onTab);
    };
  }, [onClose]);

  function set(nombre, valor) {
    setEstado((prev) => ({ ...prev, [nombre]: valor }));
  }

  function elegirImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setImagenFile(archivo);
    setPrevia(URL.createObjectURL(archivo));
  }

  function validar() {
    const nuevosErrores = {};
    const requeridos = [
      ['nombreComun', 'El nombre común es obligatorio.'],
      ['nombreCientifico', 'El nombre científico es obligatorio.'],
      ['familia', 'La familia botánica es obligatoria.'],
      ['origen', 'El origen es obligatorio.'],
      ['tipo', 'Selecciona un tipo.'],
      ['descripcionGeneral', 'La descripción general es obligatoria.'],
      ['descripcionHojas', 'La descripción de las hojas es obligatoria.'],
      ['altura', 'La altura es obligatoria.'],
      ['impacto', 'El impacto ambiental es obligatorio.'],
      ['estadoConservacion', 'Selecciona el estado de conservación.'],
    ];
    for (const [campo, mensaje] of requeridos) {
      if (!String(estado[campo]).trim()) nuevosErrores[campo] = mensaje;
    }
    if (estado.latitud === '' || Number.isNaN(Number(estado.latitud))) {
      nuevosErrores.latitud = 'Ingresa una latitud válida.';
    }
    if (estado.longitud === '' || Number.isNaN(Number(estado.longitud))) {
      nuevosErrores.longitud = 'Ingresa una longitud válida.';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();
    setMensajeError(null);
    if (!validar()) return;
    const datos = {
      ...estado,
      usos: estado.usos
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
      imagenFile,
    };
    datosPendientes.current = datos;
    setEnviando(true);
    setPasswordError(null);
    setPasswordDialogoAbierto(true);
  }

  async function confirmarGuardado(password) {
    const datos = datosPendientes.current;
    setPasswordCargando(true);
    setPasswordError(null);
    try {
      const guardada = plantaEditable
        ? await actualizarPlanta(plantaEditable._id, { ...datos, password })
        : await crearPlanta({ ...datos, password });
      setPasswordDialogoAbierto(false);
      onGuardado(guardada);
    } catch (error) {
      if (/contraseña/i.test(error.message)) {
        setPasswordError(error.message);
      } else {
        setPasswordDialogoAbierto(false);
        setMensajeError(error.message);
        setEnviando(false);
      }
    }
    setPasswordCargando(false);
  }

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-titulo"
        ref={dialogoRef}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="form-titulo" className="modal-titulo">{titulo}</h2>
          <Boton variante="ghost" clase="modal-cerrar" onClick={onClose} aria-label="Cerrar">
            ✕
          </Boton>
        </header>

        <form onSubmit={guardar} noValidate>
          <section className="form-seccion" aria-label="Buscar para editar">
            <h3 className="form-seccion-titulo">Editar por ID</h3>
            <div className="form-busqueda-id">
              <input
                id="f-id"
                className="form-input"
                placeholder="Pega aquí el ID de una especie para editarla…"
                value={idBusqueda}
                onChange={(e) => {
                  setIdBusqueda(e.target.value);
                  if (mensajeId) setMensajeId(null);
                }}
              />
              <Boton variant="primary" onClick={cargarPorId} disabled={cargandoFicha}>
                {cargandoFicha ? 'Buscando…' : 'Cargar'}
              </Boton>
            </div>
            <p className="form-ayuda">
              El ID aparece en cada ficha del catálogo. Al cargarlo, el formulario se llena
              solo y guardar actualiza esa especie en vez de crear una nueva.
            </p>
            {mensajeId && (
              <p
                className={mensajeId.tipo === 'error' ? 'form-error' : 'form-ok'}
                role={mensajeId.tipo === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {mensajeId.texto}
              </p>
            )}
          </section>

          <section className="form-seccion" aria-label="Identificación">
            <h3 className="form-seccion-titulo">Identificación</h3>
            <div className="form-grid">
              <CampoFormulario id="f-nombre" etiqueta="Nombre común" requerido error={errores.nombreComun}>
                <input
                  id="f-nombre"
                  className="form-input"
                  value={estado.nombreComun}
                  onChange={(e) => set('nombreComun', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-cientifico" etiqueta="Nombre científico" requerido error={errores.nombreCientifico}>
                <input
                  id="f-cientifico"
                  className="form-input"
                  value={estado.nombreCientifico}
                  onChange={(e) => set('nombreCientifico', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-familia" etiqueta="Familia botánica" requerido error={errores.familia}>
                <input
                  id="f-familia"
                  className="form-input"
                  value={estado.familia}
                  onChange={(e) => set('familia', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-tipo" etiqueta="Tipo" requerido error={errores.tipo}>
                <select
                  id="f-tipo"
                  className="form-select"
                  value={estado.tipo}
                  onChange={(e) => set('tipo', e.target.value)}
                  required
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </CampoFormulario>
              <CampoFormulario id="f-origen" etiqueta="Origen" requerido error={errores.origen}>
                <input
                  id="f-origen"
                  className="form-input"
                  value={estado.origen}
                  onChange={(e) => set('origen', e.target.value)}
                  required
                />
              </CampoFormulario>
            </div>
          </section>

          <section className="form-seccion" aria-label="Descripción">
            <h3 className="form-seccion-titulo">Descripción</h3>
            <div className="form-grid">
              <CampoFormulario id="f-descripcion" etiqueta="Descripción general" requerido error={errores.descripcionGeneral}>
                <textarea
                  id="f-descripcion"
                  className="form-textarea"
                  rows="3"
                  value={estado.descripcionGeneral}
                  onChange={(e) => set('descripcionGeneral', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-hojas" etiqueta="Hojas" requerido error={errores.descripcionHojas}>
                <textarea
                  id="f-hojas"
                  className="form-textarea"
                  rows="3"
                  value={estado.descripcionHojas}
                  onChange={(e) => set('descripcionHojas', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-altura" etiqueta="Altura" requerido error={errores.altura}>
                <input
                  id="f-altura"
                  className="form-input"
                  placeholder="Ej. 15 – 25 m"
                  value={estado.altura}
                  onChange={(e) => set('altura', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-usos" etiqueta="Usos tradicionales" error={errores.usos}>
                <input
                  id="f-usos"
                  className="form-input"
                  placeholder="Separados por comas (ej. medicinal, sombra)"
                  value={estado.usos}
                  onChange={(e) => set('usos', e.target.value)}
                />
              </CampoFormulario>
              <div className="form-grid form-grid-span2">
                <CampoFormulario id="f-impacto" etiqueta="Importancia ambiental" requerido error={errores.impacto}>
                  <textarea
                    id="f-impacto"
                    className="form-textarea"
                    rows={3}
                    value={estado.impacto}
                    onChange={(e) => set('impacto', e.target.value)}
                    required
                  />
                </CampoFormulario>
              </div>
            </div>
          </section>

          <section className="form-seccion" aria-label="Conservación y ubicación">
            <h3 className="form-seccion-titulo">Conservación y ubicación</h3>
            <div className="form-grid">
              <CampoFormulario id="f-estado" etiqueta="Estado de conservación" requerido error={errores.estadoConservacion}>
                <select
                  id="f-estado"
                  className="form-select"
                  value={estado.estadoConservacion}
                  onChange={(e) => set('estadoConservacion', e.target.value)}
                  required
                >
                  {ESTADOS_CONSERVACION.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </CampoFormulario>
              <CampoFormulario id="f-lat" etiqueta="Latitud" requerido error={errores.latitud}>
                <input
                  id="f-lat"
                  className="form-input"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={estado.latitud}
                  onChange={(e) => set('latitud', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-lng" etiqueta="Longitud" requerido error={errores.longitud}>
                <input
                  id="f-lng"
                  className="form-input"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={estado.longitud}
                  onChange={(e) => set('longitud', e.target.value)}
                  required
                />
              </CampoFormulario>
              <CampoFormulario id="f-ubicacion" etiqueta="Descripción de la ubicación">
                <input
                  id="f-ubicacion"
                  className="form-input"
                  placeholder="Ej. Esquina noreste del parque"
                  value={estado.ubicacionDescripcion}
                  onChange={(e) => set('ubicacionDescripcion', e.target.value)}
                />
              </CampoFormulario>
            </div>
          </section>

          <section className="form-seccion" aria-label="Imagen">
            <h3 className="form-seccion-titulo">Fotografía</h3>
            <div className="form-imagen">
              <img
                className="form-imagen-previa"
                src={previa || PLACEHOLDER}
                alt={previa ? 'Imagen actual de la especie' : 'Sin imagen'}
                onError={(e) => { e.target.src = PLACEHOLDER; }}
              />
              <div className="form-imagen-accion">
                <label className="btn btn-ghost form-archivo">
                  {esEdicion && previa && !imagenFile ? 'Cambiar foto' : 'Subir foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={elegirImagen}
                  />
                </label>
                {imagenFile && (
                  <Boton variante="ghost" onClick={() => { setImagenFile(null); setPrevia(plantaEditable?.imagen || ''); }}>
                    Quitar foto nueva
                  </Boton>
                )}
                <p className="form-ayuda">JPG, PNG, GIF o WebP · máx. 5 MB</p>
              </div>
            </div>
          </section>

          {mensajeError && <p className="form-error form-error-bloque" role="alert" aria-live="assertive">{mensajeError}</p>}

          <footer className="form-acciones">
            <Boton variante="ghost" onClick={onClose} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton variante="primary" tipo="submit" disabled={enviando}>
              {enviando
                ? 'Verificando…'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Agregar especie'}
            </Boton>
          </footer>
        </form>
      </div>

      {passwordDialogoAbierto && (
        <DialogoPassword
          titulo="Contraseña requerida"
          descripcion={
            esEdicion
              ? 'Para guardar los cambios de esta especie necesitas la contraseña de administrador.'
              : 'Para registrar esta especie en el catálogo necesitas la contraseña de administrador.'
          }
          cargando={passwordCargando}
          error={passwordError}
          onCerrar={() => {
            setPasswordDialogoAbierto(false);
            setEnviando(false);
          }}
          alConfirmar={confirmarGuardado}
        />
      )}
    </div>
  );
}