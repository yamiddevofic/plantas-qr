import PropTypes from 'prop-types';

/**
 * Casilla de una foto: vista previa en su proporción real, nombre y para qué
 * sirve, y abajo las acciones (cámara, galería). La esquina de la foto lleva la
 * acción secundaria (quitar o deshacer). La usan las fotos del individuo y las
 * fotos de lugar fijo de la especie, para que todas se vean y se usen igual.
 *
 * `estado`: 'nueva' (aún sin guardar) o 'quitar' (se borrará al guardar: la foto
 * se ve atenuada para que se sepa cuál se va).
 */
export default function CasillaFoto({
  titulo, Icono, formato = '', ayuda = '', proporcion, imagen = '', alt, estado = null, esquina = null, clase = '', children,
}) {
  return (
    <div className={`casilla-foto ${clase}`.trim()}>
      <div className={`casilla-foto-previa${estado === 'quitar' ? ' se-quita' : ''}`} style={{ aspectRatio: proporcion }}>
        {imagen ? (
          <img src={imagen} alt={alt} />
        ) : (
          <span className="casilla-foto-vacia" aria-hidden="true">
            <Icono />
            <span>Sin foto</span>
          </span>
        )}
        {estado && (
          <span className={`casilla-foto-estado es-${estado}`}>{estado === 'nueva' ? 'Nueva' : 'Se quitará'}</span>
        )}
        {esquina}
      </div>
      <div className="casilla-foto-cuerpo">
        <p className="casilla-foto-titulo">
          <Icono aria-hidden="true" />
          <strong>{titulo}</strong>
          {formato && <span className="casilla-foto-formato">{formato}</span>}
        </p>
        {ayuda && <p className="casilla-foto-ayuda">{ayuda}</p>}
      </div>
      <div className="casilla-foto-acciones">{children}</div>
    </div>
  );
}

CasillaFoto.propTypes = {
  titulo: PropTypes.string.isRequired,
  Icono: PropTypes.elementType.isRequired,
  /** Proporción indicada al lado del nombre, p. ej. «4:5». */
  formato: PropTypes.string,
  ayuda: PropTypes.string,
  /** Ancho / alto de la vista previa. */
  proporcion: PropTypes.number.isRequired,
  imagen: PropTypes.string,
  alt: PropTypes.string.isRequired,
  estado: PropTypes.oneOf(['nueva', 'quitar', null]),
  /** Botón redondo sobre la esquina de la foto (quitar, deshacer). */
  esquina: PropTypes.node,
  clase: PropTypes.string,
  /** Botones de abajo: usar las clases casilla-foto-boton. */
  children: PropTypes.node,
};
