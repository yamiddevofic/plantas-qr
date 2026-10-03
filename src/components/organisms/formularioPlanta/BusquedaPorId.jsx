import Boton from '../../atoms/Boton';

export default function BusquedaPorId({ idBusqueda, onCambiar, onCargar, cargando, mensaje }) {
  return (
    <section className="form-seccion" aria-label="Buscar para editar">
      <h3 className="form-seccion-titulo">Editar por ID</h3>
      <div className="form-busqueda-id">
        <input
          id="f-id"
          className="form-input"
          placeholder="Pega aquí el ID de una especie para editarla…"
          value={idBusqueda}
          onChange={(e) => onCambiar(e.target.value)}
        />
        <Boton variant="primary" onClick={onCargar} disabled={cargando}>
          {cargando ? 'Buscando…' : 'Cargar'}
        </Boton>
      </div>
      <p className="form-ayuda">
        El ID aparece en cada ficha del catálogo. Al cargarlo, el formulario se llena
        solo y guardar actualiza esa especie en vez de crear una nueva.
      </p>
      {mensaje && (
        <p
          className={mensaje.tipo === 'error' ? 'form-error' : 'form-ok'}
          role={mensaje.tipo === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {mensaje.texto}
        </p>
      )}
    </section>
  );
}
