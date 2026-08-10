import mongoose from 'mongoose';

const qrSchema = new mongoose.Schema(
  {
    plantaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Planta',
      required: true,
    },
    url: { type: String, required: true },
    imagen: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const QR = mongoose.model('QR', qrSchema);

export default QR;
