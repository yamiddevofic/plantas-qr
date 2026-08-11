import BotonActualizar from '../atoms/BotonActualizar';
import ContadorEspecies from '../molecules/ContadorEspecies';

export default function BarraHerramientas({
  total,
  filtrados,
  activos,
  actualizando,
  onActualizar,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-contador">
        <ContadorEspecies total={total} filtrados={filtrados} activos={activos} />
        <BotonActualizar onClick={onActualizar} cargando={actualizando} />
      </div>
    </div>
  );
}