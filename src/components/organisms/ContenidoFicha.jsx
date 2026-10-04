import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchIndividuos } from '../../api';
import { normalizarUsos } from '../../constantes';
import EstadoConservacion from '../molecules/EstadoConservacion';
import SeccionFicha from '../molecules/SeccionFicha';
import Chip from '../atoms/Chip';
import {
  IconoCorazonHoja, IconoHoja, IconoLibro, IconoUbicacion, IconoUsos,
} from '../atoms/IconosInicio';
import MapaIndividuos from './MapaIndividuos';
import ListaIndividuosFicha from './ListaIndividuosFicha';
import DatosFicha from './DatosFicha';

/**
 * Contenido de la ficha. En escritorio, dos columnas: la principal (descripción,
 * usos, ubicación y mapa) y la lateral (datos rápidos, estado y `lateral`, el
 * panel del QR). En móvil ambas se intercalan: primero los datos y el estado.
 */
export default function ContenidoFicha({ planta, onVerEstados, lateral = null }) {
  const { nombre, descripcion, usos, impacto, ubicacion, ubicaciones, estadoConservacion } = planta;
  const usosLista = normalizarUsos(usos);
  const sitios = Array.isArray(ubicaciones) ? ubicaciones : [];

  // Individuos registrados (árboles con GPS): se listan en "Dónde verlo" y se
  // dibujan en el mapa. Si la API falla, la ficha sigue sin ellos.
  const [coleccion, setColeccion] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    fetchIndividuos(planta._id, { signal: control.signal })
      .then(setColeccion)
      .catch((error) => {
        if (error.name !== 'AbortError') console.warn('Individuos no disponibles:', error.message);
      });
    return () => control.abort();
  }, [planta._id]);

  const individuos = coleccion?.features ?? [];

  const verEnMapa = (feature) => {
    document.getElementById('ficha-mapa')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPedido({ id: feature.properties.id, vez: Date.now() });
  };

  const hayUbicacion = Boolean(ubicacion?.descripcion) || individuos.length > 0 || sitios.length > 0;

  return (
    <div className="ficha-layout">
      <div className="ficha-principal">
        {(descripcion?.general || descripcion?.hojas || impacto) && (
          <SeccionFicha id="ficha-conoce" antetitulo="Descripción" titulo="Conoce este árbol" icono={IconoLibro}>
            {descripcion?.general && <p className="detalle-parrafo">{descripcion.general}</p>}
            {descripcion?.hojas && (
              <div className="detalle-hojas">
                <IconoHoja />
                <p><strong>Hojas.</strong> {descripcion.hojas}</p>
              </div>
            )}
            {impacto && (
              <div className="detalle-impacto">
                <span className="detalle-impacto-icono"><IconoCorazonHoja /></span>
                <div>
                  <p className="detalle-impacto-label">Importancia ambiental</p>
                  <p>{impacto}</p>
                </div>
              </div>
            )}
          </SeccionFicha>
        )}

        {usosLista.length > 0 && (
          <SeccionFicha id="ficha-usos" antetitulo="Saberes" titulo="Usos tradicionales" icono={IconoUsos}>
            <ul className="detalle-usos">
              {usosLista.map((u, i) => <Chip key={u} indice={i}>{u}</Chip>)}
            </ul>
          </SeccionFicha>
        )}

        {hayUbicacion && (
          <SeccionFicha id="ficha-donde" antetitulo="Ubicación" titulo="Dónde verlo en el parque" icono={IconoUbicacion}>
            {ubicacion?.descripcion && <p className="detalle-parrafo">{ubicacion.descripcion}</p>}

            {individuos.length > 0 ? (
              <ListaIndividuosFicha
                individuos={individuos}
                seleccionado={seleccionado}
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

        <MapaIndividuos
          coleccion={coleccion}
          nombreEspecie={nombre.comun}
          pedido={pedido}
          onSeleccion={setSeleccionado}
        />
      </div>

      <div className="ficha-lateral">
        <DatosFicha planta={planta} />
        {estadoConservacion && (
          <EstadoConservacion estado={estadoConservacion} onVerEscala={onVerEstados} />
        )}
        {lateral}
      </div>
    </div>
  );
}

ContenidoFicha.propTypes = {
  planta: PropTypes.object.isRequired,
  /** Abre la ventana con la escala de estados de conservación. */
  onVerEstados: PropTypes.func,
  /** Contenido extra al final de la columna lateral (el panel del QR). */
  lateral: PropTypes.node,
};
