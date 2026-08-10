import Spinner from '../atoms/Spinner';
import EstadoBox from '../atoms/EstadoBox';
import Boton from '../atoms/Boton';
import GaleriaFotos from '../organisms/GaleriaFotos';
import SeccionFicha from '../molecules/SeccionFicha';
import Hecho from '../molecules/Hecho';
import Chip from '../atoms/Chip';
import { listaImagenes, normalizarUsos } from '../../constantes';

export default function PlantillaDetalle({ cargando, error, planta }) {
  const { nombre, familia, origen, tipo, altura, descripcion, usos, impacto, estadoConservacion, ubicacion, ubicaciones, imagen } = planta || {};
  const lat = Number.isFinite(Number(ubicacion?.latitud)) ? Number(ubicacion.latitud).toFixed(6) : null;
  const lng = Number.isFinite(Number(ubicacion?.longitud)) ? Number(ubicacion.longitud).toFixed(6) : null;
  const usosLista = normalizarUsos(usos);
  const imagenes = listaImagenes({ imagen, imagenes: planta?.imagenes });
  const sitios = Array.isArray(ubicaciones) && ubicaciones.length > 0 ? ubicaciones : [];

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">
        Saltar al contenido
      </a>

      <main id="app-main" className="app-main">
        {cargando ? (
          <Spinner etiqueta="Cargando ficha" />
        ) : error || !planta ? (
          <EstadoBox
            icono="🍂"
            titulo="Esta ficha no está disponible"
            texto={error || 'Puede que la especie haya sido retirada del catálogo.'}
          >
            <Boton enlace href="#/" variante="primary">
              Volver al catálogo
            </Boton>
          </EstadoBox>
        ) : (
          <article className="marco-detalle">
            <nav aria-label="Navegación de la ficha">
              <Boton enlace href="#/" variante="ghost" clase="detalle-back">
                <span aria-hidden="true">←</span> Volver al catálogo
              </Boton>
            </nav>

            <div className="detalle-fila">
            <div className="detalle-col detalle-col-lateral">

            <div className="detalle-hero">
              <GaleriaFotos
                imagenes={imagenes}
                ejemplares={planta.ejemplares || []}
                alt={`Fotografía de ${nombre.comun} (${nombre.cientifico})`}
                tipo={tipo}
                estado={estadoConservacion}
              />
              <div className="detalle-cuerpo">
                <p className="app-eyebrow">Parque principal de Chitagá</p>
                <h2 className="detalle-nombre">{nombre.comun}</h2>
                <p className="card-cientifico">{nombre.cientifico}</p>
              </div>
            </div>

            {(familia || origen || altura || ubicacion?.descripcion || (lat && lng)) && (
              <SeccionFicha id="ficha-datos" titulo="Datos rápidos">
                <div className="detalle-facts">
                  <Hecho icono="🌱" etiqueta="Familia" valor={familia && `Familia ${familia}`} />
                  <Hecho icono="🌎" etiqueta="Origen" valor={origen} />
                  <Hecho icono="📏" etiqueta="Altura" valor={altura} />
                  <Hecho icono="📍" etiqueta="Ubicación" valor={ubicacion?.descripcion} />
                  {lat && lng && <Hecho icono="🧭" etiqueta="Coordenadas" valor={`${lat}, ${lng}`} />}
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
            </div>

            <div className="detalle-col detalle-col-contenido">

            {(descripcion?.general || descripcion?.hojas || impacto) && (
              <SeccionFicha id="ficha-conoce" titulo="Conoce este árbol">
                <div className="detalle-texto">
                  {descripcion?.general && <p>{descripcion.general}</p>}
                  {descripcion?.hojas && <p><strong>Hojas:</strong> {descripcion.hojas}</p>}
                </div>
                {impacto && (
                  <div className="detalle-impacto">
                    <span aria-hidden="true">💚</span>
                    <p><strong>Importancia ambiental:</strong> {impacto}</p>
                  </div>
                )}
              </SeccionFicha>
            )}

            {usosLista.length > 0 && (
              <SeccionFicha id="ficha-usos" titulo="Usos tradicionales">
                <div className="detalle-usos">
                  {usosLista.map((u) => <Chip key={u}>{u}</Chip>)}
                </div>
              </SeccionFicha>
            )}
            </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}