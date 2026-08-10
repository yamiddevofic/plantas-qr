import Busqueda from '../molecules/Busqueda';
import SelectorFiltro from '../molecules/SelectorFiltro';
import Boton from '../atoms/Boton';

export default function BarraFiltros({
  busqueda,
  setBusqueda,
  familias,
  tipos,
  estados,
  filtroFamilia,
  setFiltroFamilia,
  filtroTipo,
  setFiltroTipo,
  filtroEstado,
  setFiltroEstado,
  activos,
  onLimpiar,
}) {
  return (
    <div className="filtros" role="search" aria-label="Buscar y filtrar especies del parque">
      <Busqueda valor={busqueda} onChange={setBusqueda} onLimpiar={() => setBusqueda('')} />
      <SelectorFiltro etiqueta="Familia" valor={filtroFamilia} opciones={familias} onCambio={setFiltroFamilia} opcionVacia="Todas" />
      <SelectorFiltro etiqueta="Tipo" valor={filtroTipo} opciones={tipos} onCambio={setFiltroTipo} />
      <SelectorFiltro etiqueta="Conservación" valor={filtroEstado} opciones={estados} onCambio={setFiltroEstado} />
      {activos && (
        <Boton variante="ghost" clase="filtro-reset" onClick={onLimpiar}>
          Limpiar filtros
        </Boton>
      )}
    </div>
  );
}