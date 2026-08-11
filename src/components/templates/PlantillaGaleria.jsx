import { useEffect, useState } from 'react';
import { LuImages } from 'react-icons/lu';
import MenuHerramientas from '../organisms/MenuHerramientas';
import ListaPlantas from '../organisms/ListaPlantas';
import BuscadorLupa from '../organisms/BuscadorLupa';
import EstadoBox from '../atoms/EstadoBox';
import Boton from '../atoms/Boton';
import BotonMenu from '../atoms/BotonMenu';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import PiePagina from '../molecules/PiePagina';
import DialogoPassword from '../molecules/DialogoPassword';

export default function PlantillaGaleria({
  cargando,
  error,
  onReintentar,
  filtros,
  generando,
  puedeGenerar,
  onCrear,
  onRegenerarTodos,
  onEditarImagenes,
  onArchivos,
  onVerEstados,
  mensajeQR,
  sinResultados,
  plantas,
  todasLasPlantas,
  formularioAbierto,
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

      <header
        className={`galeria-header ${headerOculto ? 'galeria-header-oculto' : ''}`.trim()}
      >
        <div className="galeria-header-titulo">
          <LuImages aria-hidden="true" className="galeria-header-icono" />
          <h1 id="catalogo-titulo" className="galeria-header-texto">
            Galería de especies
          </h1>
        </div>
        <div className="hero-acciones-grupo">
          <BuscadorLupa plantas={todasLasPlantas} />
          <BotonMenu abierto={menuAbierto} onClick={() => setMenuAbierto((a) => !a)} />
        </div>
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
              onCrear={onCrear}
              onEditarImagenes={onEditarImagenes}
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
              <div className="catalogo-contenido">
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

            <Boton
              variante="primary"
              clase={`fab ${formularioAbierto ? 'abierto' : ''}`.trim()}
              onClick={onCrear}
              aria-label="Agregar nueva especie"
              title="Agregar nueva especie"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Boton>
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