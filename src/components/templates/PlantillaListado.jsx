import EncabezadoApp from '../organisms/EncabezadoApp';
import BarraFiltros from '../organisms/BarraFiltros';
import EscalaConservacion from '../organisms/EscalaConservacion';
import BarraHerramientas from '../organisms/BarraHerramientas';
import ListaPlantas from '../organisms/ListaPlantas';
import EstadoBox from '../atoms/EstadoBox';
import Spinner from '../atoms/Spinner';
import Boton from '../atoms/Boton';

export default function PlantillaListado({
  cargando,
  error,
  onReintentar,
  filtros,
  contador,
  generando,
  puedeGenerar,
  onCrear,
  onRegenerarTodos,
  onActualizar,
  mensajeQR,
  sinResultados,
  plantas,
  qrs,
  onDeleted,
  onQRRegenerated,
  onEdit,
}) {
  return (
    <div className="app">
      <a className="skip-link" href="#app-main">
        Saltar al contenido
      </a>

      <EncabezadoApp />

      {!cargando && !error && <BarraFiltros {...filtros} />}
      {!cargando && !error && <EscalaConservacion />}

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
            <BarraHerramientas
              total={contador.total}
              filtrados={contador.filtrados}
              activos={contador.activos}
              generando={generando}
              puedeGenerar={puedeGenerar}
              onCrear={onCrear}
              onRegenerarTodos={onRegenerarTodos}
              onActualizar={onActualizar}
            />

            {mensajeQR && (
              <p
                className={mensajeQR.startsWith('Error') ? 'toolbar-note toolbar-note-error' : 'toolbar-note'}
                role={mensajeQR.startsWith('Error') ? 'alert' : 'status'}
              >
                {mensajeQR}
              </p>
            )}

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
                texto="Prueba con otro nombre o ID, o cambia los filtros de familia, tipo o conservación."
              >
                <Boton variante="primary" onClick={filtros.onLimpiar}>
                  Limpiar filtros
                </Boton>
              </EstadoBox>
            ) : (
              <ListaPlantas
                plantas={plantas}
                qrs={qrs}
                onDeleted={onDeleted}
                onQRRegenerated={onQRRegenerated}
                onEdit={onEdit}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}