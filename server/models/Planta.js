import mongoose from 'mongoose';

const plantaSchema = new mongoose.Schema(
  {
    nombre: {
      comun: { type: String, required: true, trim: true },
      cientifico: { type: String, required: true, trim: true },
    },
    familia: { type: String, required: true, trim: true },
    origen: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      required: true,
      trim: true,
      enum: ['árbol', 'arbusto', 'hierba', 'piedra', 'planta acuática', 'cactus', 'otro', 'palma', 'árbol (conífera)', 'árbol / arbusto según poda', 'arbusto / arbolito', 'arbusto bajo'],
    },
    descripcion: {
      general: { type: String, required: true },
      hojas: { type: String, required: true },
    },
    altura: { type: String, required: true, trim: true },
    usos: { type: [String], default: [] },
    impacto: { type: String, required: true, trim: true },
    estadoConservacion: {
      type: String,
      required: true,
      trim: true,
      enum: ['en peligro', 'vulnerable', 'casi amenazado', 'preocupación menor', 'datos insuficientes', 'extinto en estado silvestre', 'extinto', 'no amenazada', 'no amenazada (cultivada)', 'no amenazada, aunque cada vez más escasa en áreas urbanas', 'vulnerable (según catálogo plantaqr del parque)', 'no amenazada / ampliamente distribuida en los Andes', 'preocupación menor (LC)', 'preocupación menor (LC) / Ampliamente cultivada', 'no determinado'],
    },
    ubicacion: {
      latitud: { type: Number, required: true },
      longitud: { type: Number, required: true },
      descripcion: { type: String, trim: true },
    },
    imagen: { type: String, trim: true, default: '' },
    imagenes: { type: [String], default: [] },
    ubicaciones: { type: [String], default: [] },
    ejemplares: {
      type: [
        {
          imagen: { type: String, trim: true, default: '' },
          ubicacion: { type: String, trim: true, default: '' },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

plantaSchema.index({ 'nombre.comun': 'text', 'nombre.cientifico': 'text' });

const Planta = mongoose.model('Planta', plantaSchema);

export default Planta;
