import EstadoConservacion from '../molecules/EstadoConservacion';
import Hecho from '../molecules/Hecho';
import SeccionFicha from '../molecules/SeccionFicha';
import Chip from '../atoms/Chip';
import MapaIndividuos from './MapaIndividuos';
import { normalizarUsos } from '../../constantes';

/** Secciones informativas de la ficha: descripción, estado, usos, datos y mapa. */
export default function ContenidoFicha({ planta }) {
  const { nombre, familia, origen, altura, descripcion, usos, impacto, ubicacion, ubicaciones, estadoConservacion } = planta;
  // El catálogo importado trae 0,0 como "sin coordenadas": no es un punto real.
  const tieneCoordenadas = Number.isFinite(Number(ubicacion?.latitud)) && Number.isFinite(Number(ubicacion?.longitud))
    && !(Number(ubicacion.latitud) === 0 && Number(ubicacion.longitud) === 0);
  const lat = tieneCoordenadas ? Number(ubicacion.latitud).toFixed(6) : null;
  const lng = tieneCoordenadas ? Number(ubicacion.longitud).toFixed(6) : null;
  const usosLista = normalizarUsos(usos);
  const sitios = Array.isArray(ubicaciones) ? ubicaciones : [];

  return (
    <div className="detalle-grid">
      {(descripcion?.general || descripcion?.hojas || impacto) && (
        <SeccionFicha id="ficha-conoce" titulo="Conoce este árbol">
          {descripcion?.general && <p className="detalle-parrafo">{descripcion.general}</p>}
          {descripcion?.hojas && <p className="detalle-parrafo"><strong>Hojas:</strong> {descripcion.hojas}</p>}
          {impacto && (
            <div className="detalle-impacto">
              <span aria-hidden="true">🌿</span>
              <div>
                <p className="detalle-impacto-label">Importancia ambiental</p>
                <p>{impacto}</p>
              </div>
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

      {(familia || origen || altura || ubicacion?.descripcion || (lat && lng)) && (
        <SeccionFicha id="ficha-datos" titulo="Datos rápidos">
          <div className="detalle-facts">
            <Hecho icono="🌱" etiqueta="Familia" valor={familia && `Familia ${familia}`} />
            <Hecho icono="🌎" etiqueta="Origen" valor={origen} />
            <Hecho icono="📏" etiqueta="Altura" valor={altura} />
            <Hecho icono="📍" etiqueta="Ubicación" valor={ubicacion?.descripcion} />
            {lat && lng && <Hecho icono="🧭" etiqueta="Coordenadas" valor={`${lat}, ${lng}`} />}
            {sitios.length > 0 && (
              <Hecho icono="🌳" etiqueta="Individuos en el parque" valor={`${sitios.length} ${sitios.length === 1 ? 'individuo' : 'individuos'}`} />
            )}
          </div>
          {sitios.length > 1 && (
            <div className="detalle-ubicaciones">
              <p className="detalle-ubicaciones-titulo">📍 Ejemplares en el parque</p>
              <ul>
                {sitios.map((sitio) => <li key={sitio}>{sitio}</li>)}
              </ul>
            </div>
          )}
        </SeccionFicha>
      )}

      <MapaIndividuos especieId={planta._id} nombreEspecie={nombre.comun} />
    </div>
  );
}
