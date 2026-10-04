import { useState } from 'react';
import PropTypes from 'prop-types';
import { IconoArbolPlaca } from '../atoms/IconosInicio';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/** Abierto de entrada en tableta y escritorio; en móvil, plegado para no alejar la lista. */
const abiertoInicial = () => typeof window === 'undefined'
  || !window.matchMedia?.('(max-width: 639px)').matches;

/**
 * Cuántos árboles de cada especie hay en el parque (conteo de campo) frente a
 * cuántos ya están registrados con GPS. El conteo se corrige con − / + y se
 * guarda por especie; tocar el nombre filtra la lista de individuos.
 */
export default function EjemplaresPorEspecie({ filas, filtroActivo, onFiltrar, onGuardar, enLinea }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  // Lo que se está escribiendo en cada fila antes de guardar: { [id]: texto }.
  const [borradores, setBorradores] = useState({});
  const [guardando, setGuardando] = useState({});
  const [errores, setErrores] = useState({});

  const registrados = filas.reduce((suma, f) => suma + f.registrados, 0);
  const enParque = filas.reduce((suma, f) => suma + (f.ejemplares ?? f.registrados), 0);

  const valorDe = (fila) => borradores[fila.id] ?? (fila.ejemplares == null ? '' : String(fila.ejemplares));
  const escribir = (fila, texto) => {
    setErrores((e) => ({ ...e, [fila.id]: null }));
    setBorradores((b) => ({ ...b, [fila.id]: texto }));
  };
  const sumar = (fila, delta) => {
    const actual = Number(valorDe(fila)) || 0;
    escribir(fila, String(Math.max(0, actual + delta)));
  };

  async function guardar(fila) {
    const n = Number(valorDe(fila));
    if (!Number.isInteger(n) || n < 0) {
      setErrores((e) => ({ ...e, [fila.id]: 'Escribe un número entero de 0 en adelante.' }));
      return;
    }
    setGuardando((g) => ({ ...g, [fila.id]: true }));
    try {
      await onGuardar(fila, n);
      setBorradores((b) => {
        const resto = { ...b };
        delete resto[fila.id];
        return resto;
      });
    } catch (e) {
      if (!e.cancelado) setErrores((er) => ({ ...er, [fila.id]: e.message }));
    }
    setGuardando((g) => ({ ...g, [fila.id]: false }));
  }

  if (filas.length === 0) return null;

  return (
    <details className="ejemplares" open={abierto} onToggle={(e) => setAbierto(e.currentTarget.open)}>
      <summary className="ejemplares-resumen">
        <span className="ejemplares-icono" aria-hidden="true"><IconoArbolPlaca /></span>
        <span className="ejemplares-titulo">
          <strong>Ejemplares por especie</strong>
          <span>{plural(registrados, 'registrado', 'registrados')} de {plural(enParque, 'árbol', 'árboles')} en el parque</span>
        </span>
      </summary>

      <ul className="ejemplares-lista">
        {filas.map((fila) => {
          const valor = valorDe(fila);
          const cambiado = borradores[fila.id] != null && borradores[fila.id] !== String(fila.ejemplares ?? '');
          const total = fila.ejemplares ?? 0;
          const avance = total > 0 ? Math.min(100, (fila.registrados / total) * 100) : 0;
          const activo = filtroActivo === fila.id;
          return (
            <li key={fila.id} className={`ejemplar${activo ? ' activo' : ''}${cambiado ? ' editando' : ''}`}>
              <button
                type="button"
                className="ejemplar-nombre"
                onClick={() => onFiltrar(activo ? '' : fila.id)}
                aria-pressed={activo}
                title={activo ? 'Quitar el filtro' : 'Ver solo los individuos de esta especie'}
              >
                <strong>{fila.nombre}</strong>
                <em>{fila.cientifico}</em>
              </button>

              <div className="ejemplar-avance">
                <span className="ejemplar-barra" aria-hidden="true">
                  <span style={{ width: `${avance}%` }} />
                </span>
                <span className="ejemplar-texto">
                  {fila.ejemplares == null
                    ? `${plural(fila.registrados, 'registrado', 'registrados')} · sin conteo`
                    : `${fila.registrados} de ${plural(fila.ejemplares, 'registrado', 'registrados')}`}
                  {fila.ejemplares != null && fila.registrados > fila.ejemplares && (
                    <span className="ejemplar-alerta"> · hay más registrados que el conteo</span>
                  )}
                </span>
              </div>

              <div className="ejemplar-contador">
                <button type="button" onClick={() => sumar(fila, -1)} aria-label={`Un ejemplar menos de ${fila.nombre}`} disabled={guardando[fila.id] || !Number(valor)}>−</button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={valor}
                  placeholder="—"
                  onChange={(e) => escribir(fila, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && cambiado) guardar(fila); }}
                  aria-label={`Ejemplares de ${fila.nombre} en el parque`}
                  disabled={guardando[fila.id]}
                />
                <button type="button" onClick={() => sumar(fila, 1)} aria-label={`Un ejemplar más de ${fila.nombre}`} disabled={guardando[fila.id]}>+</button>
                {cambiado && (
                  <button
                    type="button"
                    className="ejemplar-guardar"
                    onClick={() => guardar(fila)}
                    disabled={guardando[fila.id] || !enLinea}
                    title={enLinea ? undefined : 'Necesitas conexión para guardar'}
                  >
                    {guardando[fila.id] ? 'Guardando…' : 'Guardar'}
                  </button>
                )}
              </div>

              {errores[fila.id] && <p className="form-error ejemplar-error" role="alert">{errores[fila.id]}</p>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

EjemplaresPorEspecie.propTypes = {
  /** Una fila por especie: { id, ids, nombre, cientifico, registrados, ejemplares }. */
  filas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    ids: PropTypes.arrayOf(PropTypes.string).isRequired,
    nombre: PropTypes.string.isRequired,
    cientifico: PropTypes.string,
    registrados: PropTypes.number.isRequired,
    ejemplares: PropTypes.number,
  })).isRequired,
  /** Especie por la que se está filtrando la lista ('' si ninguna). */
  filtroActivo: PropTypes.string,
  onFiltrar: PropTypes.func.isRequired,
  /** `(fila, n)` guarda el conteo; devuelve una promesa. */
  onGuardar: PropTypes.func.isRequired,
  enLinea: PropTypes.bool.isRequired,
};
