import SelectorFiltro from '../molecules/SelectorFiltro';
import Boton from '../atoms/Boton';

export default function BarraFiltros({
  familias,
  tipos,
  filtroFamilia,
  setFiltroFamilia,
  filtroTipo,
  setFiltroTipo,
  activos,
  onLimpiar,
}) {
  return (
    <div className="filtros" role="search" aria-label="Filtrar especies del parque">
      <SelectorFiltro etiqueta="Familia" valor={filtroFamilia} opciones={familias} onCambio={setFiltroFamilia} opcionVacia="Todas" />
      <SelectorFiltro etiqueta="Tipo" valor={filtroTipo} opciones={tipos} onCambio={setFiltroTipo} />
      {activos && (
        <Boton variante="ghost" clase="filtro-reset" onClick={onLimpiar}>
          Limpiar filtros
        </Boton>
      )}
    </div>
  );
}