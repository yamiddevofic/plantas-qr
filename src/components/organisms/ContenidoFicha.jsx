import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchIndividuos } from '../../api';
import { normalizarUsos } from '../../constantes';
import EstadoConservacion from '../molecules/EstadoConservacion';
import SeccionFicha from '../molecules/SeccionFicha';
import Chip from '../atoms/Chip';
import MapaIndividuos from './MapaIndividuos';
import ListaIndividuosFicha from './ListaIndividuosFicha';

/** Secciones informativas de la ficha: descripción, estado, usos, datos e individuos con su mapa. */
export default function ContenidoFicha({ planta }) {
  const { nombre, familia, origen, altura, descripcion, usos, impacto, ubicacion, ubicaciones, estadoConservacion } = planta;
  const usosLista = normalizarUsos(usos);
  const sitios = Array.isArray(ubicaciones) ? ubicaciones : [];

  // Individuos registrados (árboles con GPS): se listan en "Datos rápidos" y se
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

  const datos = [
    ['Familia', familia],
    ['Origen', origen],
    ['Altura', altura],
    ['Ubicación', ubicacion?.descripcion],
  ].filter(([, valor]) => valor);

  return (
    <div className="detalle-grid">
      {(descripcion?.general || descripcion?.hojas || impacto) && (
        <SeccionFicha id="ficha-conoce" titulo="Conoce este árbol">
          {descripcion?.general && <p className="detalle-parrafo">{descripcion.general}</p>}
          {descripcion?.hojas && <p className="detalle-parrafo"><strong>Hojas.</strong> {descripcion.hojas}</p>}
          {impacto && (
            <div className="detalle-impacto">
              <p className="detalle-impacto-label">Importancia ambiental</p>
              <p>{impacto}</p>
            </div>
          )}
        </SeccionFicha>
      )}

      {estadoConservacion && (
        <div className="detalle-estado">
          <EstadoConservacion estado={estadoConservacion} />
        </div>
      )}

      {usosLista.length > 0 && (
        <SeccionFicha id="ficha-usos" titulo="Usos tradicionales">
          <div className="detalle-usos">
            {usosLista.map((u) => <Chip key={u}>{u}</Chip>)}
          </div>
        </SeccionFicha>
      )}

      {(datos.length > 0 || individuos.length > 0 || sitios.length > 0) && (
        <SeccionFicha id="ficha-datos" titulo="Datos rápidos">
          {datos.length > 0 && (
            <dl className="detalle-datos">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="detalle-dato">
                  <dt>{etiqueta}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
          )}

          {individuos.length > 0 ? (
            <ListaIndividuosFicha
              individuos={individuos}
              seleccionado={seleccionado}
              onVer={verEnMapa}
            />
          ) : sitios.length > 0 && (
            // Sin individuos con GPS todavía: se muestran las ubicaciones descritas.
            <div className="detalle-ubicaciones">
              <p className="detalle-ubicaciones-titulo">Dónde verlo en el parque</p>
              <ul>
                {sitios.map((sitio) => <li key={sitio}>{sitio}</li>)}
              </ul>
            </div>
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
  );
}

ContenidoFicha.propTypes = {
  planta: PropTypes.object.isRequired,
};
