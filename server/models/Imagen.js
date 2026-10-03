import mongoose from 'mongoose';

// Fotos subidas desde la app. Van en la base de datos y no en disco porque el
// disco de Render se borra en cada despliegue (y Vercel no reenvía /uploads).
const imagenSchema = new mongoose.Schema(
  {
    datos: { type: Buffer, required: true },
    tipo: { type: String, default: 'image/webp' },
  },
  { timestamps: true, versionKey: false }
);

const Imagen = mongoose.model('Imagen', imagenSchema);

export default Imagen;

/** Guarda en la BD las fotos ya optimizadas por config/upload.js y devuelve sus URLs. */
export async function guardarImagenes(archivos = []) {
  const urls = [];
  for (const archivo of archivos) {
    const doc = await Imagen.create({ datos: archivo.buffer, tipo: archivo.mimetype });
    urls.push(`/api/imagenes/${doc._id}`);
  }
  return urls;
}

/** id de una URL /api/imagenes/<id>, o null si es otra clase de referencia. */
export function idDeImagen(ref) {
  const m = /^\/api\/imagenes\/([0-9a-f]{24})$/.exec(String(ref ?? ''));
  return m ? m[1] : null;
}
