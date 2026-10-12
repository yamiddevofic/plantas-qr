import { useEffect, useState } from 'react';
import MenuHerramientas from '../organisms/MenuHerramientas';
import ListaPlantas from '../organisms/ListaPlantas';
import TarjetaMapa from '../organisms/TarjetaMapa';
import SeccionFicha from '../molecules/SeccionFicha';
import { IconoArbol } from '../atoms/IconosInicio';
import BuscadorBarra from '../organisms/BuscadorBarra';
import EstadoBox from '../atoms/EstadoBox';
import Boton from '../atoms/Boton';
import BotonMenu from '../atoms/BotonMenu';
import BotonTema from '../atoms/BotonTema';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import PiePagina from '../molecules/PiePagina';
import CatalogoSinConexion from '../molecules/CatalogoSinConexion';
import DialogoPassword from '../molecules/DialogoPassword';

/** «26 árboles registrados de 4 especies» para lectores de pantalla. */
function textoArboles(coleccion) {
  const features = coleccion.features.filter((f) => f.properties.especie?._id);
  const arboles = features.reduce((s, f) => s + (f.properties.cantidad ?? 1), 0);
  const especies = new Set(features.map((f) => f.properties.especie._id)).size;
  const n = (k, uno, varios) => `${k} ${k === 1 ? uno : varios}`;
  return `${n(arboles, 'árbol registrado', 'árboles registrados')} de ${n(especies, 'especie', 'especies')}.`;
}

export default function PlantillaGaleria({
  cargando,
  error,
  onReintentar,
  filtros,
  generando,
  puedeGenerar,
  onRegenerarTodos,
  onGestionarEspecies,
  onArchivos,
  onVerEstados,
  mensajeQR,
  sinResultados,
  plantas,
  todasLasPlantas,
  individuos = null,
  qrDialogo,
  puertaAdmin,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [headerOculto, setHeaderOculto] = useState(false);

  useEffect(() => {
    let previo = window.scrollY;
    let pendiente = 0;
    const alScroll = () => {
      if (pendiente) return;
      pendiente = requestAnimationFrame(() => {
        pendiente = 0;
        const actual = window.scrollY;
        if (actual > previo + 4 && actual > 80) setHeaderOculto(true);
        else if (actual < previo - 4) setHeaderOculto(false);
        previo = actual;
      });
    };
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', alScroll);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, []);

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">
        Saltar al contenido
      </a>

      <header className={`catalogo-barra${headerOculto ? ' catalogo-barra-oculta' : ''}`}>
        <BotonMenu abierto={menuAbierto} onClick={() => setMenuAbierto((a) => !a)} />
        <BuscadorBarra plantas={todasLasPlantas} />
        <BotonTema />
      </header>

      <main id="app-main" className="app-main">
        {cargando ? (
          <div className="cargando-central">
            <ArbolitoLoader etiqueta="Cargando catálogo" />
          </div>
        ) : error ? (
          <EstadoBox icono="⚠️" titulo="No pudimos cargar el catálogo" texto={error} clase="error-box" alerta>
            <Boton variante="retry" onClick={onReintentar}>
              Reintentar
            </Boton>
          </EstadoBox>
        ) : (
          <>
            <MenuHerramientas
              abierto={menuAbierto}
              onCerrar={() => setMenuAbierto(false)}
              filtros={filtros}
              generando={generando}
              puedeGenerar={puedeGenerar}
              onGestionarEspecies={onGestionarEspecies}
              onArchivos={onArchivos}
              onVerEstados={onVerEstados}
              onRegenerarTodos={onRegenerarTodos}
            />

            {mensajeQR && (
              <p
                className={mensajeQR.startsWith('Error') ? 'toolbar-note toolbar-note-error' : 'toolbar-note'}
                role={mensajeQR.startsWith('Error') ? 'alert' : 'status'}
                aria-live="polite"
              >
                {mensajeQR}
              </p>
            )}

            <section id="catalogo" aria-labelledby="catalogo-titulo">
              <SeccionFicha
                id="catalogo-titulo"
                antetitulo="Catálogo"
                titulo="Galería de especies"
                icono={IconoArbol}
                clase="catalogo-cabecera"
                // Acceso a la página del mapa: todos los árboles del parque.
                accion={individuos?.features?.length > 0
                  ? <TarjetaMapa id="galeria-mapa" href="#/mapa" descripcion={textoArboles(individuos)} />
                  : null}
              />
              <div className="catalogo-contenido">
              <CatalogoSinConexion />
              {plantas.length === 0 ? (
                <EstadoBox
                  icono="🌳"
                  titulo="Aún no hay especies registradas"
                  texto="Cuando se registre el primer árbol del parque, su ficha aparecerá aquí lista para generar su código QR."
                />
              ) : sinResultados ? (
                <EstadoBox
                  icono="🔎"
                  titulo="No hay especies que coincidan"
                  texto="Prueba con otro nombre o ID, o cambia los filtros de familia o tipo."
                >
                  <Boton variante="primary" onClick={filtros.onLimpiar}>
                    Limpiar filtros
                  </Boton>
                </EstadoBox>
              ) : (
                <ListaPlantas plantas={plantas} />
              )}
              </div>
            </section>

          </>
        )}
      </main>

      <PiePagina />

      {qrDialogo.abierto && (
        <DialogoPassword
          titulo="Generar todos los códigos QR"
          descripcion="Esta acción actualiza los códigos QR de todas las especies del catálogo. Solo quien conoce la contraseña de administrador puede realizarla."
          cargando={generando}
          error={qrDialogo.error}
          onCerrar={qrDialogo.onCerrar}
          alConfirmar={qrDialogo.alConfirmar}
        />
      )}

      {puertaAdmin.abierto && (
        <DialogoPassword
          titulo="Acceso de administrador"
          descripcion="Verifica tu contraseña antes de ingresar a esta herramienta. Solo quien conoce la contraseña de administrador puede entrar."
          cargando={puertaAdmin.cargando}
          error={puertaAdmin.error}
          onCerrar={puertaAdmin.onCerrar}
          alConfirmar={puertaAdmin.alConfirmar}
        />
      )}
    </div>
  );
}