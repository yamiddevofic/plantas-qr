import { useRef, useState } from 'react';
import { crearPlanta, actualizarPlanta, buscarPlanta } from '../../api';
import useModal from '../../hooks/useModal';
import DialogoPassword from '../molecules/DialogoPassword';
import Boton from '../atoms/Boton';
import BusquedaPorId from './formularioPlanta/BusquedaPorId';
import SeccionConservacion from './formularioPlanta/SeccionConservacion';
import SeccionDescripcion from './formularioPlanta/SeccionDescripcion';
import SeccionFotografia from './formularioPlanta/SeccionFotografia';
import SeccionIdentificacion from './formularioPlanta/SeccionIdentificacion';
import { inicialEstado } from './formularioPlanta/datosPlanta';
import { esIdLocal } from '../../offline/colaEspecies';

/**
 * Modal para agregar o editar una especie. Con `onEncolar` y sin conexión (o si
 * la red se cae al enviar) el cambio no se pierde: se entrega a `onEncolar({ datos,
 * planta })` para guardarlo en el dispositivo; la contraseña se pide al sincronizar.
 */
export default function FormularioPlanta({ planta, onClose, onGuardado, enLinea = true, onEncolar = null }) {
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
  const dialogoRef = useModal(onClose);

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
    if (estado.ejemplaresEnParque !== '' && !(Number.isInteger(Number(estado.ejemplaresEnParque)) && Number(estado.ejemplaresEnParque) >= 0)) {
      nuevosErrores.ejemplaresEnParque = 'Escribe un número entero de 0 en adelante.';
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
      // Una línea por uso; si todo va en una sola línea, se separa por comas.
      usos: estado.usos
        .split(estado.usos.includes('\n') ? '\n' : ',')
        .map((u) => u.trim())
        .filter(Boolean),
      imagenFile,
    };
    datosPendientes.current = datos;
    setEnviando(true);
    if (!enLinea && onEncolar) {
      await encolar(datos);
      return;
    }
    setPasswordError(null);
    setPasswordDialogoAbierto(true);
  }

  // Sin conexión: se guarda en el dispositivo y la página lo envía cuando vuelva internet.
  async function encolar(datos) {
    try {
      await onEncolar({ datos, planta: plantaEditable });
    } catch (error) {
      setMensajeError(error.message);
      setEnviando(false);
    }
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
      if (error.sinRed && onEncolar) {
        // La red se cayó al enviar: el cambio no se pierde.
        setPasswordDialogoAbierto(false);
        setPasswordCargando(false);
        await encolar(datos);
        return;
      }
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
          <BusquedaPorId
            idBusqueda={idBusqueda}
            onCambiar={(valor) => {
              setIdBusqueda(valor);
              if (mensajeId) setMensajeId(null);
            }}
            onCargar={cargarPorId}
            cargando={cargandoFicha}
            mensaje={mensajeId}
          />

          <SeccionIdentificacion estado={estado} errores={errores} set={set} />

          <SeccionDescripcion estado={estado} errores={errores} set={set} />

          <SeccionConservacion estado={estado} errores={errores} set={set} />

          <SeccionFotografia
            esEdicion={esEdicion}
            bloqueada={esEdicion && !enLinea && !esIdLocal(plantaEditable._id)}
            previa={previa}
            imagenFile={imagenFile}
            onElegir={elegirImagen}
            onQuitar={() => { setImagenFile(null); setPrevia(plantaEditable?.imagen || ''); }}
          />

          {!enLinea && onEncolar && (
            <p className="form-ayuda" role="status">
              Sin conexión: los cambios se guardan en este dispositivo y se envían cuando vuelva
              internet (ahí se pedirá la contraseña de administrador).
            </p>
          )}

          {mensajeError && <p className="form-error form-error-bloque" role="alert" aria-live="assertive">{mensajeError}</p>}

          <footer className="form-acciones">
            <Boton variante="ghost" onClick={onClose} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton variante="primary" tipo="submit" disabled={enviando}>
              {enviando
                ? (enLinea ? 'Verificando…' : 'Guardando…')
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