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
    // Fotos con un solo uso, que se gestionan en «Fotos» (PUT /api/plantas/:id/fotos):
    // la portada de la galería en modo noche y las de la hoja, el tallo y el fruto en la ficha.
    imagenNoche: { type: String, trim: true, default: '' },
    imagenHoja: { type: String, trim: true, default: '' },
    imagenTallo: { type: String, trim: true, default: '' },
    imagenFruto: { type: String, trim: true, default: '' },
    ubicaciones: { type: [String], default: [] },
    // ── Datos ampliados (fichas importadas de las notas de campo) ──
    nombresAlternos: { type: [String], default: undefined },
    caracteristicas: {
      flores: { type: String, trim: true },
      frutos: { type: String, trim: true },
      tronco: { type: String, trim: true },
    },
    habitat: {
      distribucion: { type: String, trim: true },
      altitud: { type: String, trim: true },
      clima: { type: String, trim: true },
    },
    datosCuriosos: { type: [String], default: undefined },
    cuidados: { type: String, trim: true },
    especiesSimilares: { type: [String], default: undefined },
    // Texto completo del estado (p. ej. "En peligro en su hábitat de Australia,
    // pero muy cultivado"); `estadoConservacion` es el nivel de la escala.
    estadoConservacionDetalle: { type: String, trim: true },
    // Uso interno: cómo se identificó la especie. No se muestra en la ficha.
    identificacion: {
      confianza: { type: String, trim: true },
      observaciones: { type: String, trim: true },
    },
    // Cuántos árboles de la especie hay en el parque (conteo de campo).
    ejemplaresEnParque: { type: Number, min: 0 },
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
