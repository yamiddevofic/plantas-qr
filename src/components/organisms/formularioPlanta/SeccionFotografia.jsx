import Boton from '../../atoms/Boton';
import { PLACEHOLDER } from '../../../constantes';

export default function SeccionFotografia({ esEdicion, previa, imagenFile, onElegir, onQuitar }) {
  return (
    <section className="form-seccion" aria-label="Imagen">
      <h3 className="form-seccion-titulo">Fotografía</h3>
      <div className="form-imagen">
        <img
          className="form-imagen-previa"
          src={previa || PLACEHOLDER}
          alt={previa ? 'Imagen actual de la especie' : 'Sin imagen'}
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="form-imagen-accion">
          <label className="btn btn-ghost form-archivo">
            {esEdicion && previa && !imagenFile ? 'Cambiar foto' : 'Subir foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={onElegir}
            />
          </label>
          {imagenFile && (
            <Boton variante="ghost" onClick={onQuitar}>
              Quitar foto nueva
            </Boton>
          )}
          <p className="form-ayuda">JPG, PNG, GIF o WebP · máx. 5 MB</p>
        </div>
      </div>
    </section>
  );
}
