import { useState } from 'react';
import { LuDownload, LuHouse, LuMoon, LuRefreshCcw, LuShieldAlert, LuSun, LuTreeDeciduous } from 'react-icons/lu';
import EstadoBox from '../atoms/EstadoBox';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import BotonMenu from '../atoms/BotonMenu';
import GaleriaFotos from '../organisms/GaleriaFotos';
import Hero from '../organisms/Hero';
import MenuLateral from '../organisms/MenuLateral';
import SeccionContacto from '../molecules/SeccionContacto';
import BuscadorLupa from '../organisms/BuscadorLupa';
import GrupoMenu from '../molecules/GrupoMenu';
import ItemMenu from '../atoms/ItemMenu';
import SeccionFicha from '../molecules/SeccionFicha';
import Hecho from '../molecules/Hecho';
import PiePagina from '../molecules/PiePagina';
import DialogoPassword from '../molecules/DialogoPassword';
import EstadoConservacion from '../molecules/EstadoConservacion';
import Chip from '../atoms/Chip';
import { listaImagenes, normalizarUsos } from '../../constantes';
import { generarQR } from '../../api';
import { useTema } from '../../tema.js';

export default function PlantillaDetalle({ cargando, error, planta, qr, onQrGenerado, onVerEstados }) {
  const { nombre, familia, origen, altura, descripcion, usos, impacto, ubicacion, ubicaciones, estadoConservacion, imagen } = planta || {};
  const lat = Number.isFinite(Number(ubicacion?.latitud)) ? Number(ubicacion.latitud).toFixed(6) : null;
  const lng = Number.isFinite(Number(ubicacion?.longitud)) ? Number(ubicacion.longitud).toFixed(6) : null;
  const usosLista = normalizarUsos(usos);
  const imagenes = listaImagenes({ imagen, imagenes: planta?.imagenes });
  const sitios = Array.isArray(ubicaciones) && ubicaciones.length > 0 ? ubicaciones : [];
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [errorQR, setErrorQR] = useState(null);
  const [exitoQR, setExitoQR] = useState(null);
  const [accionDialogo, setAccionDialogo] = useState(null);
  const [protegiendo, setProtegiendo] = useState(false);
  const [errorPassword, setErrorPassword] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const { tema, alternar } = useTema();
  const esOscuro = tema === 'oscuro';

  async function copiarId() {
    if (!planta?._id) return;
    try {
      await navigator.clipboard.writeText(planta._id);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  const irAlCatalogo = () => {
    window.location.hash = '#/galeria';
    setMenuAbierto(false);
  };

  function ejecutarDescarga(qrActual) {
    const nombreLimpio = String(planta.nombre.comun)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const enlace = document.createElement('a');
    enlace.href = qrActual.imagen;
    enlace.download = `plantaqr-${nombreLimpio || planta._id}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }

  async function descargarQR() {
    setErrorQR(null);
    setExitoQR(null);
    if (qr) {
      setDescargando(true);
      try {
        ejecutarDescarga(qr);
      } catch (e) {
        setErrorQR(`No se pudo descargar el QR: ${e.message}`);
      } finally {
        setDescargando(false);
      }
      return;
    }
    setAccionDialogo('descargar');
  }

  const textosDialogo = {
    regenerar: {
      titulo: 'Regenerar código QR',
      descripcion: 'Genera de nuevo el código QR de esta especie. Solo quien conoce la contraseña de administrador puede realizarlo.',
    },
    descargar: {
      titulo: 'Generar código QR',
      descripcion: 'Esta especie aún no tiene código QR. Para generarlo y descargarlo se requiere la contraseña de administrador.',
    },
  };

  async function confirmarAccion(password) {
    setProtegiendo(true);
    setErrorPassword(null);
    try {
      const actualizado = await generarQR(planta._id, password);
      onQrGenerado?.(actualizado);
      if (accionDialogo === 'descargar') {
        ejecutarDescarga(actualizado);
      } else {
        setExitoQR('Código QR regenerado correctamente.');
      }
      setAccionDialogo(null);
    } catch (e) {
      setErrorPassword(e.message);
    } finally {
      setProtegiendo(false);
    }
  }

  return (
    <div className="detalle-root">
      <a className="skip-link" href="#app-main">
        Saltar al contenido
      </a>

      <div className="hero-acciones">
        <div className="hero-acciones-grupo">
          <BuscadorLupa />
          <BotonMenu abierto={menuAbierto} onClick={() => setMenuAbierto((a) => !a)} />
        </div>
      </div>

      <MenuLateral abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)}>
        <GrupoMenu titulo="Navegación">
          <ItemMenu
            icono={<LuHouse aria-hidden="true" />}
            etiqueta="Inicio"
            descripcion="Conoce el parque y el proyecto"
            onClick={() => {
              window.location.hash = '#/';
              setMenuAbierto(false);
            }}
          />
          <ItemMenu
            icono={<LuTreeDeciduous aria-hidden="true" />}
            etiqueta="Galería de especies"
            descripcion="Explorar las plantas del parque"
            onClick={irAlCatalogo}
          />
        </GrupoMenu>
        <GrupoMenu titulo="Herramientas">
          <ItemMenu
            icono={<LuRefreshCcw aria-hidden="true" />}
            etiqueta="Regenerar código QR"
            descripcion="Actualizar el QR de esta especie (requiere contraseña)"
            onClick={() => {
              setAccionDialogo('regenerar');
              setMenuAbierto(false);
            }}
          />
          <ItemMenu
            icono={<LuShieldAlert aria-hidden="true" />}
            etiqueta="Estados de conservación"
            descripcion="Ver la escala de colores usada en las fichas"
            onClick={() => {
              onVerEstados?.();
              setMenuAbierto(false);
            }}
          />
        </GrupoMenu>
        <GrupoMenu titulo="Apariencia">
          <ItemMenu
            icono={esOscuro ? <LuMoon aria-hidden="true" /> : <LuSun aria-hidden="true" />}
            etiqueta="Modo oscuro"
            descripcion={
              esOscuro
                ? 'Activado — cambiar a modo claro'
                : 'Desactivado — fondo y textos oscuros'
            }
            pulsado={esOscuro}
            onClick={alternar}
          />
        </GrupoMenu>
        <SeccionContacto />
      </MenuLateral>

      <main id="app-main">
        {cargando ? (
          <div className="cargando-ficha">
            <ArbolitoLoader etiqueta="Cargando ficha" />
          </div>
        ) : error || !planta ? (
          <div className="app">
            <EstadoBox
              icono="🍂"
              titulo="Esta ficha no está disponible"
              texto={error || 'Puede que la especie haya sido retirada del catálogo.'}
            >
              <Boton enlace href="#/galeria" variante="primary">
                Volver al catálogo
              </Boton>
            </EstadoBox>
          </div>
        ) : (
          <article>
            <Hero
              variante="detalle"
              media={
                <GaleriaFotos
                  imagenes={imagenes}
                  alt={`Fotografía de ${nombre.comun} (${nombre.cientifico})`}
                />
              }
              corchete="Parque principal de Chitagá"
              titulo={nombre.comun}
              subtitulo={nombre.cientifico}
            />

            <div className="detalle-contenido">
              <div className="detalle-grid">
                {(descripcion?.general || descripcion?.hojas || impacto) && (
                  <SeccionFicha id="ficha-conoce" titulo="Conoce este árbol">
                    {descripcion?.general && <p className="detalle-parrafo">{descripcion.general}</p>}
                    {descripcion?.hojas && <p className="detalle-parrafo"><strong>Hojas:</strong> {descripcion.hojas}</p>}
                    {impacto && (
                      <div className="detalle-impacto">
                        <span aria-hidden="true">🌿</span>
                        <div>
                          <p className="detalle-impacto-label">Importancia ambiental</p>
                          <p>{impacto}</p>
                        </div>
                      </div>
                    )}
                  </SeccionFicha>
                )}

                {estadoConservacion && (
                  <div className="detalle-estado">
                    <EstadoConservacion estado={estadoConservacion} />
                  </div>
                )}

                {usosLista.length > 0 && (
                  <SeccionFicha id="ficha-usos" titulo="Usos tradicionales">
                    <div className="detalle-usos">
                      {usosLista.map((u) => <Chip key={u}>{u}</Chip>)}
                    </div>
                  </SeccionFicha>
                )}

                {(familia || origen || altura || ubicacion?.descripcion || (lat && lng)) && (
                  <SeccionFicha id="ficha-datos" titulo="Datos rápidos">
                    <div className="detalle-facts">
                      <Hecho icono="🌱" etiqueta="Familia" valor={familia && `Familia ${familia}`} />
                      <Hecho icono="🌎" etiqueta="Origen" valor={origen} />
                      <Hecho icono="📏" etiqueta="Altura" valor={altura} />
                      <Hecho icono="📍" etiqueta="Ubicación" valor={ubicacion?.descripcion} />
                      {lat && lng && <Hecho icono="🧭" etiqueta="Coordenadas" valor={`${lat}, ${lng}`} />}
                      {sitios.length > 0 && (
                        <Hecho icono="🌳" etiqueta="Individuos en el parque" valor={`${sitios.length} ${sitios.length === 1 ? 'individuo' : 'individuos'}`} />
                      )}
                    </div>
                    {sitios.length > 1 && (
                      <div className="detalle-ubicaciones">
                        <p className="detalle-ubicaciones-titulo">📍 Ejemplares en el parque</p>
                        <ul>
                          {sitios.map((sitio) => <li key={sitio}>{sitio}</li>)}
                        </ul>
                      </div>
                    )}
                  </SeccionFicha>
                )}
              </div>

              <div className="detalle-qr">
                <div className="detalle-id">
                  <span className="detalle-id-etiqueta">ID de la especie</span>
                  <code className="detalle-id-valor">{planta._id}</code>
                  <button
                    type="button"
                    className="detalle-id-copiar"
                    onClick={copiarId}
                    title="Copiar ID al portapapeles"
                  >
                    {copiado ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                {qr && (
                  <img
                    className="detalle-qr-imagen"
                    src={qr.imagen}
                    alt={`Código QR de ${nombre.comun}`}
                    width={96}
                    height={96}
                  />
                )}
                <div className="detalle-qr-info">
                  <Boton variante="primary" onClick={descargarQR} disabled={descargando}>
                    <LuDownload aria-hidden="true" className="btn-lupa-icono" />
                    {descargando ? 'Preparando…' : 'Descargar QR'}
                  </Boton>
                  <p className="detalle-qr-nota">
                    El código QR de este árbol enlaza a su ficha para que las
                    visitas lo escaneen y conozcan la especie.
                    {sitios.length > 0 && (
                      <>
                        {' '}Se han registrado {sitios.length} {sitios.length === 1 ? 'individuo' : 'individuos'}
                        {' '}de esta especie en distintas zonas del parque.
                      </>
                    )}
                  </p>
                  {errorQR && <p className="form-error" role="alert" aria-live="assertive">{errorQR}</p>}
                  {exitoQR && <p className="detalle-qr-exito" role="status">{exitoQR}</p>}
                </div>
              </div>
            </div>
          </article>
        )}
      </main>

      <PiePagina />

      {accionDialogo && (
        <DialogoPassword
          titulo={textosDialogo[accionDialogo].titulo}
          descripcion={textosDialogo[accionDialogo].descripcion}
          cargando={protegiendo}
          error={errorPassword}
          onCerrar={() => setAccionDialogo(null)}
          alConfirmar={confirmarAccion}
        />
      )}
    </div>
  );
}