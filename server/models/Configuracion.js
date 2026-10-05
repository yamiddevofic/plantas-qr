import mongoose from 'mongoose';

/**
 * Ajustes generales de la app, uno por documento (`clave` única). Por ahora solo
 * `vistaMapa`: la cámara con la que abre el mapa de todas las fichas.
 */
const configuracionSchema = new mongoose.Schema(
  {
    clave: { type: String, required: true, unique: true },
    valor: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Configuracion = mongoose.model('Configuracion', configuracionSchema);

export default Configuracion;
