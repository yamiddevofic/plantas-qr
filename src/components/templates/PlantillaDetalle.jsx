import { useState } from 'react';
import { LuHouse, LuMoon, LuRefreshCcw, LuShieldAlert, LuSun, LuTreeDeciduous } from 'react-icons/lu';
import EstadoBox from '../atoms/EstadoBox';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import Boton from '../atoms/Boton';
import BotonMenu from '../atoms/BotonMenu';
import BotonTema from '../atoms/BotonTema';
import { IconoVolver } from '../atoms/IconosInicio';
import GaleriaFotos from '../organisms/GaleriaFotos';
import Hero from '../organisms/Hero';
import ContenidoFicha from '../organisms/ContenidoFicha';
import PanelQR from '../organisms/PanelQR';
import MenuLateral from '../organisms/MenuLateral';
import SeccionContacto from '../molecules/SeccionContacto';
import BuscadorLupa from '../organisms/BuscadorLupa';
import ItemInstalarApp from '../molecules/ItemInstalarApp';
import GrupoMenu from '../molecules/GrupoMenu';
import ItemMenu from '../atoms/ItemMenu';
import PiePagina from '../molecules/PiePagina';
import DialogoPassword from '../molecules/DialogoPassword';
import { listaImagenes } from '../../constantes';
import { generarQR } from '../../api';
import { useTema } from '../../tema.js';

// Fecha de la foto, que va en su URL (?v=<ms>); las antiguas sin fecha cuentan como primeras.
const fechaFoto = (url) => Number(/[?&]v=(\d+)/.exec(url)?.[1] ?? 0);

/** La primera foto tomada (la más antigua) entre los individuos, para ese campo. */
function primeraFoto(coleccion, campo) {
  const urls = (coleccion?.features ?? []).map((f) => f.properties[campo]).filter(Boolean);
  return urls.sort((a, b) => fechaFoto(a) - fechaFoto(b))[0] ?? null;
}

export default function PlantillaDetalle({ cargando, error, planta, qr, coleccion = null, onQrGenerado, onVerEstados }) {
  const { nombre, imagen } = planta || {};
  // El hero usa la primera foto tomada de los individuos: la vertical en móvil y
  // la horizontal en escritorio. Sin ellas, las fotos del catálogo.
  const fotoMovil = primeraFoto(coleccion, 'imagen');
  const fotoEscritorio = primeraFoto(coleccion, 'imagenEscritorio');
  const imagenes = fotoMovil ? [fotoMovil] : listaImagenes({ imagen, imagenes: planta?.imagenes });
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
          <a className="boton-volver" href="#/galeria" aria-label="Volver a las especies" title="Volver a las especies">
            <IconoVolver />
          </a>
          <BuscadorLupa />
          <BotonTema />
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
          <ItemInstalarApp onCerrarMenu={() => setMenuAbierto(false)} />
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
                  imagenEscritorio={fotoEscritorio}
                  alt={`Fotografía de ${nombre.comun} (${nombre.cientifico})`}
                />
              }
              corchete="Parque Principal de Chitagá"
              titulo={nombre.comun}
              subtitulo={nombre.cientifico}
              badge={
                (planta.tipo || planta.familia) && (
                  <ul className="detalle-hero-etiquetas" aria-label="Clasificación">
                    {planta.tipo && <li>{planta.tipo}</li>}
                    {planta.familia && <li>{planta.familia}</li>}
                  </ul>
                )
              }
            />

            <div className="detalle-contenido">
              <ContenidoFicha
                planta={planta}
                coleccion={coleccion}
                onVerEstados={onVerEstados}
                lateral={
                  <PanelQR
                    planta={planta}
                    qr={qr}
                    copiado={copiado}
                    onCopiar={copiarId}
                    descargando={descargando}
                    onDescargar={descargarQR}
                    error={errorQR}
                    exito={exitoQR}
                  />
                }
              />
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