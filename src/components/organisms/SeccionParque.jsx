import PropTypes from 'prop-types';
import { LuChevronDown } from 'react-icons/lu';
import ImagenPlanta from '../atoms/ImagenPlanta';
import Boton from '../atoms/Boton';

/**
 * Sección "Conoce el parque": presenta el Parque Principal de Chitagá y el
 * proyecto de caracterización e identificación de especies con código QR.
 * Por defecto son bloques desplegables (acordeón) ocultos; con `abierto`
 * se muestran ambos contenidos extendidos (p. ej. en la página "Acerca de").
 */
export default function SeccionParque({ especies, familias, abierto = false }) {
  return (
    <section className="historia" id="conoce-parque" aria-label="Conoce el parque y el proyecto">
      <div className="historia-acordeon">
        <details id="acordeon-parque" className="historia-acordeon-item" open={abierto || undefined}>
          <summary className="historia-acordeon-titulo">
            <span className="historia-acordeon-cabecera">
              <span className="historia-eyebrow">Nuestro parque</span>
              <strong>Parque Principal de Chitagá</strong>
            </span>
            <LuChevronDown aria-hidden="true" />
          </summary>
          <div className="historia-acordeon-contenido">
            <p className="historia-parrafo">
              El Parque Principal es el corazón verde de Chitagá y refugio de su
              fauna silvestre: aves, ardillas y polinizadores que sostienen el
              equilibrio del entorno, frente a la Parroquia San Juan Nepomuceno,
              donde la naturaleza y la vida urbana conviven en armonía.
            </p>
            <div className="historia-imagen">
              <ImagenPlanta
                src="/parque.webp"
                alt="Parque Principal de Chitagá con la Parroquia San Juan Nepomuceno al fondo"
                ancho={596}
                alto={335}
                prioridad="auto"
                cargando="lazy"
              />
            </div>
          </div>
        </details>

        <details id="acordeon-proyecto" className="historia-acordeon-item" open={abierto || undefined}>
          <summary className="historia-acordeon-titulo">
            <span className="historia-acordeon-cabecera">
              <span className="historia-eyebrow">Nuestro proyecto</span>
              <strong>Caracterización e identificación de especies</strong>
            </span>
            <LuChevronDown aria-hidden="true" />
          </summary>
          <div className="historia-acordeon-contenido">
            <p className="historia-parrafo">
              Cada árbol queda registrado con su familia, origen, usos y estado
              de conservación, y enlazado a un código QR que las visitas pueden
              escanear para conocer su ficha.
            </p>

            <dl className="historia-datos">
              <div className="historia-dato">
                <dt>{especies}</dt>
                <dd>Especies registradas</dd>
              </div>
              <div className="historia-dato">
                <dt>{familias}</dt>
                <dd>Familias botánicas</dd>
              </div>
              <div className="historia-dato">
                <dt>QR</dt>
                <dd>En cada árbol</dd>
              </div>
            </dl>

            <div className="historia-accion">
              <Boton enlace href="#/galeria" variante="primary">
                Conoce nuestras especies
              </Boton>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

SeccionParque.propTypes = {
  /** Número de especies registradas en el catálogo. */
  especies: PropTypes.number.isRequired,
  /** Número de familias botánicas distintas en el catálogo. */
  familias: PropTypes.number.isRequired,
  /** Muestra ambos bloques extendidos (en vez de acordeón colapsado). */
  abierto: PropTypes.bool,
};