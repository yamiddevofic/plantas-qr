import mongoose from 'mongoose';

const individuoSchema = new mongoose.Schema(
  {
    codigoArbol: { type: String, required: true, trim: true, uppercase: true, unique: true },
    especieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Planta',
      required: true,
      index: true,
    },
    parque: { type: String, required: true, trim: true },
    ubicacion: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(coordinates) {
            return coordinates.length === 2
              && coordinates[0] >= -180 && coordinates[0] <= 180
              && coordinates[1] >= -90 && coordinates[1] <= 90;
          },
          message: 'Las coordenadas GeoJSON deben ser [longitud, latitud] válidas',
        },
      },
    },
    altitudMsnm: { type: Number, min: 0 },
    precisionGpsM: { type: Number, min: 0 },
    imagen: { type: String, trim: true, default: '' },
    // Foto tomada desde la app. Va en la base de datos y no en disco porque el
    // disco de Render se borra en cada despliegue. `select: false` evita
    // cargar el binario en los listados.
    foto: {
      type: new mongoose.Schema(
        { datos: Buffer, tipo: String, actualizada: Date },
        { _id: false }
      ),
      select: false,
    },
  },
  { timestamps: true, versionKey: false }
);

individuoSchema.index({ ubicacion: '2dsphere' });
individuoSchema.index({ especieId: 1, codigoArbol: 1 }, { unique: true });

const Individuo = mongoose.model('Individuo', individuoSchema);

export default Individuo;
