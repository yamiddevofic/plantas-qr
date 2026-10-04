import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LuSearch, LuX } from 'react-icons/lu';
import { listaImagenes } from '../../constantes';

const SUGERENCIAS = 3;
const MAX_RESULTADOS = 5;

const normalizar = (texto) => String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Una ficha por nombre científico: el catálogo histórico repite especies (una por foto). */
function unicas(plantas) {
  const vistas = new Set();
  return plantas.filter((p) => {
    const clave = normalizar(p.nombre?.cientifico || p.nombre?.comun);
    if (vistas.has(clave)) return false;
    vistas.add(clave);
    return true;
  });
}

function Miniatura({ planta }) {
  const [rota, setRota] = useState(false);
  const foto = listaImagenes(planta)[0];
  if (!foto || rota) return <span className="buscador-inicio-foto buscador-inicio-foto-vacia" aria-hidden="true">🌿</span>;
  return <img className="buscador-inicio-foto" src={foto} alt="" loading="lazy" decoding="async" onError={() => setRota(true)} />;
}

Miniatura.propTypes = { planta: PropTypes.object.isRequired };

/**
 * Buscador del inicio: al enfocarlo propone unas especies (el arrayán primero) y al
 * escribir filtra por nombre común, científico, familia o tipo. Elegir una lleva a su
 * ficha. Es un combobox accesible: flechas, Enter y Escape.
 */
// En móvil, al enfocar el buscador el teclado tapa la mitad baja de la pantalla:
// la barra se fija arriba del área visible y la lista ocupa lo que queda.
const ES_MOVIL = '(max-width: 767px)';

function useFocoMovil(activo, refRaiz) {
  useEffect(() => {
    const raiz = refRaiz.current;
    if (!activo || !raiz || !window.matchMedia?.(ES_MOVIL).matches) return undefined;
    const vv = window.visualViewport;
    const ajustar = () => {
      // visualViewport es el área que queda sobre el teclado (iOS y Android).
      raiz.style.setProperty('--vv-arriba', `${vv ? vv.offsetTop : 0}px`);
      raiz.style.setProperty('--vv-alto', `${vv ? vv.height : window.innerHeight}px`);
    };
    ajustar();
    vv?.addEventListener('resize', ajustar);
    vv?.addEventListener('scroll', ajustar);
    raiz.classList.add('en-foco');
    return () => {
      vv?.removeEventListener('resize', ajustar);
      vv?.removeEventListener('scroll', ajustar);
      raiz.classList.remove('en-foco');
    };
  }, [activo, refRaiz]);
}

export default function BuscadorInicio({ plantas }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const inputRef = useRef(null);
  const raizRef = useRef(null);
  const idLista = useId();
  useFocoMovil(abierto, raizRef);

  const catalogo = useMemo(() => unicas(plantas ?? []), [plantas]);

  const sugerencias = useMemo(() => {
    const arrayan = catalogo.find((p) => normalizar(p.nombre?.comun).includes('arrayan'));
    const resto = catalogo.filter((p) => p !== arrayan);
    return [arrayan, ...resto].filter(Boolean).slice(0, SUGERENCIAS);
  }, [catalogo]);

  const consulta = normalizar(texto).trim();
  const resultados = useMemo(() => {
    if (!consulta) return sugerencias;
    return catalogo
      .filter((p) => normalizar(`${p.nombre?.comun} ${p.nombre?.cientifico} ${p.familia} ${p.tipo} ${(p.nombresAlternos ?? []).join(' ')}`).includes(consulta))
      .slice(0, MAX_RESULTADOS);
  }, [catalogo, consulta, sugerencias]);

  const ir = (planta) => {
    setAbierto(false);
    window.location.hash = `#/planta/${planta._id}`;
  };

  const alTeclear = (e) => {
    if (e.key === 'Escape') {
      setAbierto(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && abierto && resultados[activo]) {
      e.preventDefault();
      ir(resultados[activo]);
    }
  };

  const mostrarPanel = abierto && Boolean(plantas);

  return (
    <div className="buscador-inicio" ref={raizRef}>
      {/* Fondo del modo foco en móvil: tocarlo cierra el buscador. */}
      <div className="buscador-inicio-fondo" aria-hidden="true" onMouseDown={(e) => { e.preventDefault(); inputRef.current?.blur(); }} />
      <div className={`buscador-inicio-barra${abierto ? ' abierto' : ''}`}>
        <LuSearch aria-hidden="true" className="buscador-inicio-lupa" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={mostrarPanel}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={mostrarPanel && resultados[activo] ? `${idLista}-${activo}` : undefined}
          aria-label="Buscar una planta por nombre, familia o categoría"
          placeholder="Busca rápidamente una planta"
          autoComplete="off"
          spellCheck="false"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setActivo(0); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={alTeclear}
        />
        {texto && (
          <button
            type="button"
            className="buscador-inicio-limpiar"
            aria-label="Borrar búsqueda"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setTexto(''); setActivo(0); inputRef.current?.focus(); }}
          >
            <LuX aria-hidden="true" />
          </button>
        )}
      </div>

      {mostrarPanel && (
        <div className="buscador-inicio-panel" onMouseDown={(e) => e.preventDefault()}>
          <p className="buscador-inicio-titulo" id={`${idLista}-titulo`}>
            {consulta ? 'Resultados' : 'Sugerencias'}
          </p>
          {resultados.length === 0 ? (
            <p className="buscador-inicio-vacio" role="status">
              Nada coincide con “{texto.trim()}”. Prueba con un nombre, una familia o un tipo de planta.
            </p>
          ) : (
            <ul id={idLista} role="listbox" aria-labelledby={`${idLista}-titulo`}>
              {resultados.map((p, i) => (
                <li
                  key={p._id}
                  id={`${idLista}-${i}`}
                  role="option"
                  aria-selected={i === activo}
                  className={`buscador-inicio-opcion${i === activo ? ' activa' : ''}`}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => ir(p)}
                >
                  <Miniatura planta={p} />
                  <span className="buscador-inicio-texto">
                    <strong>{p.nombre.comun}</strong>
                    <em>{p.nombre.cientifico}</em>
                  </span>
                  <span className="buscador-inicio-etiquetas">
                    {p.familia && <span>{p.familia}</span>}
                    {p.tipo && <span>{p.tipo}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

BuscadorInicio.propTypes = {
  /** Catálogo completo; null mientras carga. */
  plantas: PropTypes.arrayOf(PropTypes.object),
};
