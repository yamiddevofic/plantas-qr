import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LuCamera, LuImage, LuLocateFixed } from 'react-icons/lu';
import useModal from '../../hooks/useModal';
import { sugerirCodigo } from '../../individuos';
import { comprimirFoto } from '../../offline/fotos';
import Boton from '../atoms/Boton';
import CampoFormulario from '../molecules/CampoFormulario';
import SelectorUbicacion from './SelectorUbicacion';

function valorInicial(feature, parquePorDefecto) {
  const p = feature?.properties;
  const [longitud, latitud] = feature?.geometry?.coordinates ?? ['', ''];
  return {
    especieId: p?.especie?._id ?? '',
    codigoArbol: p?.codigoArbol ?? '',
    parque: p?.parque ?? parquePorDefecto,
    latitud,
    longitud,
    altitudMsnm: p?.altitudMsnm ?? '',
    precisionGpsM: p?.precisionGpsM ?? '',
    imagen: p?.imagen ?? '',
  };
}

const numeroOVacio = (valor) => (valor === '' || valor == null ? null : Number(valor));

/**
 * Modal para registrar o editar un individuo (árbol físico) y su ubicación.
 * `onGuardar(datos)` devuelve una promesa: si se rechaza, el mensaje se muestra
 * en el formulario; un rechazo con `cancelado` se ignora en silencio.
 */
export default function FormularioIndividuo({ individuo, especies, individuos, parquePorDefecto, onClose, onGuardar }) {
  const dialogoRef = useModal(onClose);
  const esEdicion = Boolean(individuo);
  const [estado, setEstado] = useState(() => {
    const inicial = valorInicial(individuo, parquePorDefecto);
    // La ficha guardada puede ser una hermana del grupo: se normaliza a la del grupo.
    const grupo = especies.find((e) => e.ids.includes(inicial.especieId));
    return { ...inicial, especieId: grupo?.id ?? inicial.especieId };
  });
  const [codigoEditado, setCodigoEditado] = useState(esEdicion);
  const [errores, setErrores] = useState({});
  const [mensajeError, setMensajeError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [mensajeGps, setMensajeGps] = useState(null);
  const [foto, setFoto] = useState(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const previaFoto = useMemo(() => (foto ? URL.createObjectURL(foto) : ''), [foto]);
  // Libera la URL temporal de la vista previa al cambiar de foto o cerrar.
  useEffect(() => () => { if (previaFoto) URL.revokeObjectURL(previaFoto); }, [previaFoto]);

  async function elegirFoto(e) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setProcesandoFoto(true);
    setFoto(await comprimirFoto(archivo));
    setProcesandoFoto(false);
  }

  // Al corregir un campo se retira su error en vez de esperar al siguiente envío.
  const limpiarErrores = (...campos) => setErrores((prev) => {
    if (!campos.some((c) => prev[c])) return prev;
    const copia = { ...prev };
    for (const c of campos) delete copia[c];
    return copia;
  });
  const set = (campo, valor) => {
    setEstado((prev) => ({ ...prev, [campo]: valor }));
    limpiarErrores(campo);
  };

  const codigos = useMemo(
    () => individuos.filter((f) => f.properties.id !== individuo?.properties.id).map((f) => f.properties.codigoArbol),
    [individuos, individuo],
  );
  const referencias = useMemo(
    () => individuos.filter((f) => f.properties.id !== individuo?.properties.id),
    [individuos, individuo],
  );

  function elegirEspecie(especieId) {
    limpiarErrores('especieId', 'codigoArbol');
    setEstado((prev) => {
      const siguiente = { ...prev, especieId };
      if (!codigoEditado) {
        const especie = especies.find((e) => e.id === especieId);
        siguiente.codigoArbol = especie ? sugerirCodigo(especie.nombre, codigos) : '';
      }
      return siguiente;
    });
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setMensajeGps({ tipo: 'error', texto: 'Tu navegador no ofrece geolocalización.' });
      return;
    }
    setBuscandoGps(true);
    setMensajeGps(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setEstado((prev) => ({
          ...prev,
          latitud: Number(coords.latitude.toFixed(7)),
          longitud: Number(coords.longitude.toFixed(7)),
          precisionGpsM: Number(coords.accuracy.toFixed(1)),
          altitudMsnm: coords.altitude != null ? Number(coords.altitude.toFixed(0)) : prev.altitudMsnm,
        }));
        limpiarErrores('latitud', 'longitud', 'altitudMsnm', 'precisionGpsM');
        setMensajeGps({ tipo: 'ok', texto: `Ubicación tomada del GPS (±${coords.accuracy.toFixed(1)} m).` });
        setBuscandoGps(false);
      },
      (error) => {
        setMensajeGps({
          tipo: 'error',
          texto: error.code === 1 ? 'No diste permiso para usar tu ubicación.' : 'No se pudo obtener tu ubicación.',
        });
        setBuscandoGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function validar() {
    const nuevos = {};
    if (!estado.especieId) nuevos.especieId = 'Selecciona la especie.';
    const codigo = estado.codigoArbol.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{1,31}$/.test(codigo)) {
      nuevos.codigoArbol = 'Usa letras, números y guiones (p. ej. CIP-011).';
    } else if (codigos.includes(codigo)) {
      nuevos.codigoArbol = 'Ya existe un individuo con ese código.';
    }
    if (!estado.parque.trim()) nuevos.parque = 'El parque es obligatorio.';
    const lat = estado.latitud === '' ? NaN : Number(estado.latitud);
    const lng = estado.longitud === '' ? NaN : Number(estado.longitud);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) nuevos.latitud = 'Latitud entre -90 y 90.';
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) nuevos.longitud = 'Longitud entre -180 y 180.';
    for (const campo of ['altitudMsnm', 'precisionGpsM']) {
      const n = numeroOVacio(estado[campo]);
      if (n !== null && (!Number.isFinite(n) || n < 0)) nuevos[campo] = 'Debe ser un número mayor o igual a 0.';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar(e) {
    e.preventDefault();
    setMensajeError(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      await onGuardar({
        especieId: estado.especieId,
        codigoArbol: estado.codigoArbol.trim().toUpperCase(),
        parque: estado.parque.trim(),
        latitud: Number(estado.latitud),
        longitud: Number(estado.longitud),
        altitudMsnm: numeroOVacio(estado.altitudMsnm),
        precisionGpsM: numeroOVacio(estado.precisionGpsM),
      }, foto);
    } catch (error) {
      if (!error.cancelado) setMensajeError(error.message);
      setEnviando(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ind-titulo"
        ref={dialogoRef}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="ind-titulo" className="modal-titulo">
            {esEdicion ? `Editar ${individuo.properties.codigoArbol}` : 'Agregar individuo'}
          </h2>
          <Boton variante="ghost" clase="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</Boton>
        </header>

        <form onSubmit={enviar} noValidate>
          <section className="form-seccion" aria-label="Identificación">
            <h3 className="form-seccion-titulo">Identificación</h3>
            <div className="form-grid">
              <CampoFormulario id="ind-especie" etiqueta="Especie" requerido error={errores.especieId}>
                <select
                  id="ind-especie"
                  className="form-select"
                  value={estado.especieId}
                  onChange={(e) => elegirEspecie(e.target.value)}
                >
                  <option value="">Selecciona una especie…</option>
                  {especies.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre} ({e.cientifico})</option>
                  ))}
                </select>
              </CampoFormulario>
              <CampoFormulario id="ind-codigo" etiqueta="Código del árbol" requerido error={errores.codigoArbol}>
                <input
                  id="ind-codigo"
                  className="form-input"
                  value={estado.codigoArbol}
                  maxLength={32}
                  placeholder="Ej. CIP-011"
                  onChange={(e) => {
                    setCodigoEditado(true);
                    set('codigoArbol', e.target.value.toUpperCase());
                  }}
                />
              </CampoFormulario>
              <CampoFormulario id="ind-parque" etiqueta="Parque" requerido error={errores.parque}>
                <input
                  id="ind-parque"
                  className="form-input"
                  value={estado.parque}
                  onChange={(e) => set('parque', e.target.value)}
                />
              </CampoFormulario>
            </div>
          </section>

          <section className="form-seccion" aria-label="Ubicación">
            <h3 className="form-seccion-titulo">Ubicación</h3>
            <p className="form-ayuda">
              Toca el mapa o arrastra el marcador para fijar el punto, escribe las coordenadas
              o usa el GPS de tu dispositivo si estás junto al árbol. Los puntos verdes son los
              demás individuos ya registrados.
            </p>
            <SelectorUbicacion
              latitud={estado.latitud}
              longitud={estado.longitud}
              referencias={referencias}
              onCambiar={({ latitud, longitud }) => {
                setEstado((prev) => ({ ...prev, latitud, longitud }));
                limpiarErrores('latitud', 'longitud');
              }}
            />
            <div className="form-acciones-linea">
              <Boton variante="ghost" onClick={usarMiUbicacion} disabled={buscandoGps}>
                <LuLocateFixed aria-hidden="true" className="btn-lupa-icono" />
                {buscandoGps ? 'Buscando señal…' : 'Usar mi ubicación'}
              </Boton>
              {mensajeGps && (
                <p
                  className={mensajeGps.tipo === 'error' ? 'form-error' : 'form-ok'}
                  role={mensajeGps.tipo === 'error' ? 'alert' : 'status'}
                >
                  {mensajeGps.texto}
                </p>
              )}
            </div>
            <div className="form-grid">
              <CampoFormulario id="ind-lat" etiqueta="Latitud" requerido error={errores.latitud}>
                <input
                  id="ind-lat"
                  className="form-input"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={estado.latitud}
                  onChange={(e) => set('latitud', e.target.value)}
                />
              </CampoFormulario>
              <CampoFormulario id="ind-lng" etiqueta="Longitud" requerido error={errores.longitud}>
                <input
                  id="ind-lng"
                  className="form-input"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={estado.longitud}
                  onChange={(e) => set('longitud', e.target.value)}
                />
              </CampoFormulario>
              <CampoFormulario id="ind-alt" etiqueta="Altitud (msnm)" error={errores.altitudMsnm}>
                <input
                  id="ind-alt"
                  className="form-input"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={estado.altitudMsnm}
                  onChange={(e) => set('altitudMsnm', e.target.value)}
                />
              </CampoFormulario>
              <CampoFormulario id="ind-prec" etiqueta="Precisión GPS (± m)" error={errores.precisionGpsM}>
                <input
                  id="ind-prec"
                  className="form-input"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={estado.precisionGpsM}
                  onChange={(e) => set('precisionGpsM', e.target.value)}
                />
              </CampoFormulario>
            </div>
          </section>

          <section className="form-seccion" aria-label="Fotografía">
            <h3 className="form-seccion-titulo">Fotografía (opcional)</h3>
            <div className="form-imagen">
              {previaFoto || estado.imagen ? (
                <img
                  className="form-imagen-previa"
                  src={previaFoto || estado.imagen}
                  alt={previaFoto ? 'Foto nueva del árbol' : 'Foto actual del árbol'}
                />
              ) : (
                <span className="form-imagen-previa individuo-foto-vacia" aria-hidden="true">🌳</span>
              )}
              <div className="form-imagen-accion">
                <label className="btn btn-primary form-archivo">
                  <LuCamera aria-hidden="true" className="btn-lupa-icono" />
                  {procesandoFoto ? 'Procesando…' : 'Tomar foto'}
                  <input type="file" accept="image/*" capture="environment" onChange={elegirFoto} disabled={procesandoFoto} />
                </label>
                <label className="btn btn-ghost form-archivo">
                  <LuImage aria-hidden="true" className="btn-lupa-icono" />
                  Elegir de la galería
                  <input type="file" accept="image/*" onChange={elegirFoto} disabled={procesandoFoto} />
                </label>
                {foto && (
                  <Boton variante="ghost" onClick={() => setFoto(null)}>Quitar foto nueva</Boton>
                )}
                <p className="form-ayuda">
                  Sin conexión, la foto queda guardada en este dispositivo y se sube sola cuando vuelva internet.
                </p>
              </div>
            </div>
          </section>

          {mensajeError && <p className="form-error form-error-bloque" role="alert" aria-live="assertive">{mensajeError}</p>}

          <footer className="form-acciones">
            <Boton variante="ghost" onClick={onClose} disabled={enviando}>Cancelar</Boton>
            <Boton variante="primary" tipo="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Agregar individuo'}
            </Boton>
          </footer>
        </form>
      </div>
    </div>
  );
}

FormularioIndividuo.propTypes = {
  /** Feature GeoJSON a editar; omitir para crear. */
  individuo: PropTypes.object,
  /** Especies únicas: { id, ids (fichas hermanas), nombre, cientifico }. */
  especies: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** Todos los individuos (para sugerir código, detectar duplicados y referencias). */
  individuos: PropTypes.arrayOf(PropTypes.object).isRequired,
  parquePorDefecto: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onGuardar: PropTypes.func.isRequired,
};
