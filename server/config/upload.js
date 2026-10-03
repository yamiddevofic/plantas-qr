import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

const CALIDAD_WEBP = 80;
const ANCHO_MAXIMO = 1600;

// Las fotos se procesan en memoria: config → WebP aquí, y el controlador las
// guarda en MongoDB (models/Imagen.js) solo después de validar la contraseña.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const permitidos = /jpeg|jpg|png|gif|webp|heic|heif/;
  const extOk = permitidos.test(path.extname(file.originalname).toLowerCase()) || !path.extname(file.originalname);
  const mimeOk = /^image\//.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'), { status: 400 }));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const singleOriginal = upload.single.bind(upload);
const fieldsOriginal = upload.fields.bind(upload);

async function optimizar(req, res, next) {
  try {
    for (const lista of Object.values(req.files || {})) {
      for (const archivo of lista) {
        archivo.buffer = await sharp(archivo.buffer)
          .rotate()
          .resize({ width: ANCHO_MAXIMO, height: ANCHO_MAXIMO, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: CALIDAD_WEBP })
          .toBuffer();
        archivo.mimetype = 'image/webp';
        archivo.size = archivo.buffer.length;
      }
    }
    next();
  } catch (error) {
    res.status(400).json({ mensaje: `No se pudo procesar la imagen: ${error.message}` });
  }
}

function responderError(res, err) {
  const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La foto supera los 15 MB' : err.message;
  res.status(err.status || 400).json({ mensaje });
}

upload.single = (field) => (req, res, next) => {
  singleOriginal(field)(req, res, (err) => {
    if (err) return responderError(res, err);
    if (!req.file) return next();
    req.files = { [field]: [req.file] };
    optimizar(req, res, next);
  });
};

upload.fields = (campos) => (req, res, next) => {
  fieldsOriginal(campos)(req, res, (err) => {
    if (err) return responderError(res, err);
    optimizar(req, res, next);
  });
};

export default upload;
