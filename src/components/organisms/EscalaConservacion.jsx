import PuntoEscala from '../atoms/PuntoEscala';

const ESCALA = [
  { clase: 'estado-extinto', etiqueta: 'Extinto' },
  { clase: 'estado-silvestre', etiqueta: 'Extinto en silvestre' },
  { clase: 'estado-peligro', etiqueta: 'En peligro' },
  { clase: 'estado-vulnerable', etiqueta: 'Vulnerable' },
  { clase: 'estado-amenazado', etiqueta: 'Casi amenazado' },
  { clase: 'estado-escasa', etiqueta: 'Escasa en zonas urbanas' },
  { clase: 'estado-bien', etiqueta: 'No amenazada / Preocupación menor' },
  { clase: 'estado-cultivada', etiqueta: 'No amenazada (cultivada)' },
  { clase: 'estado-info', etiqueta: 'Sin datos / No determinada' },
];

export default function EscalaConservacion() {
  return (
    <aside className="escala" aria-label="Escala de estado de conservación, del riesgo crítico al estable">
      <span className="escala-titulo">Estado de conservación</span>
      <div className="escala-lista">
        {ESCALA.map((e) => (
          <span key={e.clase} className="escala-item">
            <PuntoEscala clase={e.clase} />
            {e.etiqueta}
          </span>
        ))}
      </div>
    </aside>
  );
}