import PropTypes from 'prop-types';
import ImagenPlanta from '../atoms/ImagenPlanta';
import Boton from '../atoms/Boton';
import useRevelar from '../../hooks/useRevelar';
import useContador from '../../hooks/useContador';
import {
  IconoArdilla, IconoAve, IconoFamilias, IconoFlecha, IconoHoja, IconoMariposa, IconoQr,
} from '../atoms/IconosInicio';

const FAUNA = [
  { Icono: IconoAve, nombre: 'Aves' },
  { Icono: IconoArdilla, nombre: 'Ardillas' },
  { Icono: IconoMariposa, nombre: 'Polinizadores' },
];

function Cifra({ Icono, valor, etiqueta, activo }) {
  const numero = useContador(valor, activo);
  return (
    <div className="proyecto-dato">
      <dt>
        <span className="proyecto-dato-icono"><Icono /></span>
        <span className="proyecto-dato-valor">{typeof valor === 'number' ? numero : valor ?? '—'}</span>
      </dt>
      <dd>{etiqueta}</dd>
    </div>
  );
}

Cifra.propTypes = {
  Icono: PropTypes.elementType.isRequired,
  valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  etiqueta: PropTypes.string.isRequired,
  activo: PropTypes.bool,
};

/**
 * Presenta el Parque Principal de Chitagá y el proyecto de caracterización e
 * identificación de especies con código QR. Los ids `acordeon-parque` y
 * `acordeon-proyecto` son los destinos del menú lateral.
 */
export default function SeccionParque({ especies = null, familias = null }) {
  const [refParque, parqueVisible] = useRevelar();
  const [refProyecto, proyectoVisible] = useRevelar({ umbral: 0.25 });

  return (
    <section className="inicio-seccion historia" id="conoce-parque" aria-label="Conoce el parque y el proyecto">
      <article
        id="acordeon-parque"
        ref={refParque}
        className={`parque revelar${parqueVisible ? ' revelado' : ''}`}
        aria-labelledby="parque-titulo"
      >
        <div className="parque-texto">
          <p className="inicio-eyebrow">Nuestro parque</p>
          <h2 id="parque-titulo" className="inicio-titulo">Parque Principal de Chitagá</h2>
          <p className="inicio-parrafo">
            El corazón verde de Chitagá y refugio de su fauna silvestre, frente a la
            Parroquia San Juan Nepomuceno, donde la naturaleza y la vida urbana
            conviven en armonía.
          </p>
          <ul className="parque-fauna" aria-label="Fauna que habita el parque">
            {FAUNA.map(({ Icono, nombre }) => (
              <li key={nombre}><Icono />{nombre}</li>
            ))}
          </ul>
        </div>

        <figure className="parque-foto">
          <ImagenPlanta
            src="/parque.webp"
            alt="Parque Principal de Chitagá con la Parroquia San Juan Nepomuceno al fondo"
            ancho={596}
            alto={335}
            prioridad="auto"
            cargando="lazy"
            tamanos="(min-width: 1024px) 560px, 100vw"
          />
          <figcaption>Parroquia San Juan Nepomuceno</figcaption>
        </figure>
      </article>

      <article
        id="acordeon-proyecto"
        ref={refProyecto}
        className={`proyecto revelar${proyectoVisible ? ' revelado' : ''}`}
        aria-labelledby="proyecto-titulo"
      >
        <div className="proyecto-texto">
          <p className="inicio-eyebrow">Nuestro proyecto</p>
          <h2 id="proyecto-titulo" className="inicio-titulo">
            Caracterización e identificación de especies
          </h2>
          <p className="inicio-parrafo">
            Cada árbol queda registrado con su familia, origen, usos y estado de
            conservación, y enlazado a un código QR que las visitas pueden escanear
            para conocer su ficha.
          </p>
        </div>

        <dl className="proyecto-datos">
          <Cifra Icono={IconoHoja} valor={especies} etiqueta="Especies registradas" activo={proyectoVisible} />
          <Cifra Icono={IconoFamilias} valor={familias} etiqueta="Familias botánicas" activo={proyectoVisible} />
          <Cifra Icono={IconoQr} valor="QR" etiqueta="En cada árbol" activo={proyectoVisible} />
        </dl>

        <div className="proyecto-accion">
          <Boton enlace href="#/galeria" variante="primary" clase="hero-inicio-cta">
            Conoce nuestras especies
            <IconoFlecha />
          </Boton>
        </div>
      </article>
    </section>
  );
}

SeccionParque.propTypes = {
  /** Número de especies registradas; null mientras carga. */
  especies: PropTypes.number,
  /** Número de familias botánicas distintas; null mientras carga. */
  familias: PropTypes.number,
};
