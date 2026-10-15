import PropTypes from 'prop-types';
import { normalizarUsos } from '../../constantes';
import EstadoConservacion from '../molecules/EstadoConservacion';
import SeccionFicha from '../molecules/SeccionFicha';
import Chip from '../atoms/Chip';
import {
  IconoArbol, IconoChispa, IconoCorazonHoja, IconoFlor, IconoFruto, IconoGlobo, IconoHoja,
  IconoLibro, IconoNube, IconoRegadera, IconoRegla, IconoUbicacion, IconoUsos,
} from '../atoms/IconosInicio';
import TarjetaMapa from './TarjetaMapa';
import GaleriaIndividuos from './GaleriaIndividuos';
import DatosFicha from './DatosFicha';

/**
 * Contenido de la ficha. En escritorio, dos columnas: la principal (descripción,
 * usos, ubicación y mapa) y la lateral (datos rápidos, estado y `lateral`, el
 * panel del QR). En móvil ambas se intercalan: primero los datos y el estado.
 */
export default function ContenidoFicha({ planta, coleccion = null, arbolId = null, onVerEstados, lateral = null }) {
  const {
    nombre, descripcion, usos, impacto, ubicacion, ubicaciones, estadoConservacion,
    estadoConservacionDetalle, nombresAlternos, caracteristicas, habitat, datosCuriosos,
    cuidados, especiesSimilares, imagenHoja, imagenTallo, imagenFruto, imagenFlor, creditos,
  } = planta;
  // Las fichas de las notas de campo traen los usos como frases; las antiguas,
  // como etiquetas cortas separadas por comas.
  const usosFrases = Array.isArray(usos) && usos.some((u) => String(u).length > 48);
  // Lo que ya se dijo en «Importancia ambiental» no se repite en la lista.
  const usosLista = usosFrases ? usos.filter((u) => !impacto?.includes(u)) : normalizarUsos(usos);
  const alternos = nombresAlternos ?? [];
  const similares = especiesSimilares ?? [];
  const curiosos = datosCuriosos ?? [];
  // La hoja, la flor, el tallo y el fruto pueden tener su foto (se cargan en «Fotos» de la especie).
  const rasgos = [
    { Icono: IconoHoja, etiqueta: 'Hojas', texto: descripcion?.hojas, foto: imagenHoja, alt: 'Hoja', credito: creditos?.hoja },
    { Icono: IconoFlor, etiqueta: 'Flores', texto: caracteristicas?.flores, foto: imagenFlor, alt: 'Flor', credito: creditos?.flor },
    { Icono: IconoFruto, etiqueta: 'Frutos', texto: caracteristicas?.frutos, foto: imagenFruto, alt: 'Fruto', credito: creditos?.fruto },
    { Icono: IconoArbol, etiqueta: 'Tronco', texto: caracteristicas?.tronco, foto: imagenTallo, alt: 'Tallo', credito: creditos?.tallo },
  ].filter((r) => r.texto || r.foto);
  const clima = [
    { Icono: IconoGlobo, etiqueta: 'Distribución', texto: habitat?.distribucion },
    { Icono: IconoRegla, etiqueta: 'Altitud', texto: habitat?.altitud },
    { Icono: IconoNube, etiqueta: 'Clima', texto: habitat?.clima },
  ].filter((r) => r.texto);
  const sitios = Array.isArray(ubicaciones) ? ubicaciones : [];

  // Individuos registrados (árboles con GPS): su galería de fotos va en "Dónde
  // verlo" y cada uno se ubica en la página del mapa.
  const individuos = coleccion?.features ?? [];
  const arbolesRegistrados = individuos.reduce((suma, f) => suma + (f.properties.cantidad ?? 1), 0);

  // "Ver en el mapa" abre la página del mapa con esta especie y ese árbol abierto.
  const verEnMapa = (feature) => {
    window.location.hash = `#/mapa?especie=${encodeURIComponent(planta._id)}&arbol=${encodeURIComponent(feature.properties.id)}`;
  };

  const hayUbicacion = Boolean(ubicacion?.descripcion) || individuos.length > 0 || sitios.length > 0;

  return (
    <div className="ficha-layout">
      <div className="ficha-principal">
        {(descripcion?.general || rasgos.length > 0 || impacto) && (
          <SeccionFicha id="ficha-conoce" antetitulo="Descripción" titulo="Conoce este árbol" icono={IconoLibro} clase="ficha-antes-curiosos">
            {descripcion?.general && <p className="detalle-parrafo">{descripcion.general}</p>}
            {alternos.length > 0 && (
              <div className="detalle-etiquetas">
                <p className="detalle-etiquetas-titulo">También la llaman</p>
                <ul>{alternos.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            )}
            {rasgos.map(({ Icono, etiqueta, texto, foto, alt, credito }) => (
              <div key={etiqueta} className="detalle-hojas">
                <Icono />
                <div className="detalle-rasgo">
                  <p><strong>{etiqueta}.</strong> {texto}</p>
                  {foto && (
                    <figure className="detalle-rasgo-figura">
                      <a className="detalle-rasgo-foto" href={foto} target="_blank" rel="noopener noreferrer">
                        <img
                          src={foto}
                          alt={`${alt} de ${nombre.comun}`}
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                      {credito?.texto && (
                        <figcaption className="detalle-rasgo-credito">
                          Foto:{' '}
                          {credito.enlace
                            ? <a href={credito.enlace} target="_blank" rel="noopener noreferrer">{credito.texto}</a>
                            : credito.texto}
                        </figcaption>
                      )}
                    </figure>
                  )}
                </div>
              </div>
            ))}
            {impacto && (
              <div className="detalle-impacto">
                <span className="detalle-impacto-icono"><IconoCorazonHoja /></span>
                <div>
                  <p className="detalle-impacto-label">Importancia ambiental</p>
                  <p>{impacto}</p>
                </div>
              </div>
            )}
            {similares.length > 0 && (
              <div className="detalle-etiquetas">
                <p className="detalle-etiquetas-titulo">Se puede confundir con</p>
                <ul>{similares.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            )}
          </SeccionFicha>
        )}

        {usosLista.length > 0 && (
          <SeccionFicha id="ficha-usos" antetitulo="Saberes" titulo={usosFrases ? 'Usos e importancia' : 'Usos tradicionales'} icono={IconoUsos} clase="ficha-antes-curiosos">
            {usosFrases ? (
              <ul className="detalle-lista">
                {usosLista.map((u, i) => <li key={u} style={{ '--i': i }}><IconoHoja />{u}</li>)}
              </ul>
            ) : (
              <ul className="detalle-usos">
                {usosLista.map((u, i) => <Chip key={u} indice={i}>{u}</Chip>)}
              </ul>
            )}
          </SeccionFicha>
        )}

        {clima.length > 0 && (
          <SeccionFicha id="ficha-habitat" antetitulo="Dónde crece" titulo="Hábitat y clima" icono={IconoGlobo} clase="ficha-antes-curiosos">
            <dl className="detalle-habitat">
              {clima.map(({ Icono, etiqueta, texto }, i) => (
                <div key={etiqueta} style={{ '--i': i }}>
                  <dt><Icono />{etiqueta}</dt>
                  <dd>{texto}</dd>
                </div>
              ))}
            </dl>
          </SeccionFicha>
        )}


        {cuidados && (
          <SeccionFicha id="ficha-cuidados" antetitulo="Jardinería" titulo="Cómo cuidarlo" icono={IconoRegadera}>
            <p className="detalle-parrafo detalle-cuidados">{cuidados}</p>
          </SeccionFicha>
        )}

        {hayUbicacion && (
          <SeccionFicha id="ficha-donde" antetitulo="Ubicación" titulo="Dónde verlo en el parque" icono={IconoUbicacion}>
            {ubicacion?.descripcion && <p className="detalle-parrafo">{ubicacion.descripcion}</p>}

            {individuos.length > 0 ? (
              <GaleriaIndividuos
                individuos={individuos}
                seleccionado={arbolId}
                onVer={verEnMapa}
              />
            ) : sitios.length > 0 && (
              // Sin individuos con GPS todavía: se muestran las ubicaciones descritas.
              <ul className="detalle-ubicaciones">
                {sitios.map((sitio) => <li key={sitio}><IconoUbicacion />{sitio}</li>)}
              </ul>
            )}
          </SeccionFicha>
        )}

        {/* Abre la página del mapa con solo los árboles de esta especie. */}
        {individuos.length > 0 && (
          <TarjetaMapa
            id="ficha-mapa"
            href={`#/mapa?especie=${planta._id}`}
            descripcion={`${arbolesRegistrados} ${arbolesRegistrados === 1 ? 'árbol registrado' : 'árboles registrados'} de ${nombre.comun}`}
          />
        )}
      </div>

      <div className="ficha-lateral">
        <DatosFicha planta={planta} />
        {curiosos.length > 0 && (
          <SeccionFicha id="ficha-curiosos" antetitulo="¿Sabías que…?" titulo="Datos curiosos" icono={IconoChispa} clase="ficha-curiosos">
            <ol className="detalle-curiosos">
              {curiosos.map((dato, i) => <li key={dato} style={{ '--i': i }}>{dato}</li>)}
            </ol>
          </SeccionFicha>
        )}
        {estadoConservacion && (
          <EstadoConservacion estado={estadoConservacion} detalle={estadoConservacionDetalle} onVerEscala={onVerEstados} />
        )}
        {lateral}
      </div>

    </div>
  );
}

ContenidoFicha.propTypes = {
  planta: PropTypes.object.isRequired,
  /** FeatureCollection de los individuos de la especie (null mientras carga). */
  coleccion: PropTypes.object,
  /** Abre la ventana con la escala de estados de conservación. */
  onVerEstados: PropTypes.func,
  /** Contenido extra al final de la columna lateral (el panel del QR). */
  lateral: PropTypes.node,
  /** Árbol con el que se abrió la ficha (desde el mapa): se marca en la galería. */
  arbolId: PropTypes.string,
};
