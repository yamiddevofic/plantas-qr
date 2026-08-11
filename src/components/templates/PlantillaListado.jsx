import { useState } from 'react';
import EncabezadoApp from '../organisms/EncabezadoApp';
import MenuHerramientas from '../organisms/MenuHerramientas';
import BarraHerramientas from '../organisms/BarraHerramientas';
import ListaPlantas from '../organisms/ListaPlantas';
import SeccionParque from '../organisms/SeccionParque';
import BuscadorLupa from '../organisms/BuscadorLupa';
import EstadoBox from '../atoms/EstadoBox';
import Spinner from '../atoms/Spinner';
import Boton from '../atoms/Boton';
import BotonMenu from '../atoms/BotonMenu';
import PiePagina from '../molecules/PiePagina';
import DialogoPassword from '../molecules/DialogoPassword';

export default function PlantillaListado({
  cargando,
  error,
  onReintentar,
  filtros,
  contador,
  generando,
  actualizando,
  puedeGenerar,
  onCrear,
  onRegenerarTodos,
  onActualizar,
  mensajeQR,
  sinResultados,
  plantas,
  todasLasPlantas,
  formularioAbierto,
  qrDialogo,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">
        Saltar al contenido
      </a>

      <EncabezadoApp
        acciones={
          <div className="hero-acciones-grupo">
            <BuscadorLupa plantas={todasLasPlantas} />
            <BotonMenu abierto={menuAbierto} onClick={() => setMenuAbierto((a) => !a)} />
          </div>
        }
      />

      <main id="app-main" className="app-main">
        {cargando ? (
          <Spinner etiqueta="Cargando plantas" />
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

            <SeccionParque
              especies={contador.total}
              familias={filtros.familias.length}
            />

            <div className="catalogo-bar">
              <BarraHerramientas
                total={contador.total}
                filtrados={contador.filtrados}
                activos={contador.activos}
                actualizando={actualizando}
                onActualizar={onActualizar}
              />
            </div>

            <section id="catalogo" aria-labelledby="catalogo-titulo">
              <h2 id="catalogo-titulo" className="catalogo-titulo">
                Galería de especies
              </h2>
              {actualizando && (
                <p className="catalogo-cargando" role="status" aria-live="polite">
                  <Spinner etiqueta="Actualizando catálogo" />
                  Actualizando catálogo…
                </p>
              )}
              <div className={`catalogo-contenido ${actualizando ? 'is-actualizando' : ''}`.trim()}>
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
    </div>
  );
}