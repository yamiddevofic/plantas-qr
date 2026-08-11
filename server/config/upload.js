import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const CALIDAD_WEBP = 80;
const ANCHO_MAXIMO = 1600;

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const dir = path.resolve('server/uploads');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const nombre = `planta-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, nombre);
  },
});

const fileFilter = (_req, file, cb) => {
  const permitidos = /jpeg|jpg|png|gif|webp/;
  const extOk = permitidos.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = permitidos.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
  }
};

async function optimizarImagen(ruta) {
  const tempRuta = `${ruta}.orig`;
  await fs.rename(ruta, tempRuta);
  try {
    await sharp(tempRuta)
      .rotate()
      .resize({ width: ANCHO_MAXIMO, withoutEnlargement: true })
      .webp({ quality: CALIDAD_WEBP })
      .toFile(ruta);
  } finally {
    await fs.rm(tempRuta, { force: true });
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const singleOriginal = upload.single.bind(upload);
const fieldsOriginal = upload.fields.bind(upload);

async function optimizar(req, res, next) {
  const archivos = req.files || {};
  try {
    for (const lista of Object.values(archivos)) {
      for (const archivo of lista) {
        const ruta = path.resolve('server/uploads', archivo.filename);
        await optimizarImagen(ruta);
        archivo.filename = `${archivo.filename}.webp`;
        archivo.path = path.join('server', 'uploads', archivo.filename);
        archivo.mimetype = 'image/webp';
        archivo.originalname = archivo.originalname.replace(/\.[^/.]+$/, '') + '.webp';
      }
    }
    next();
  } catch (error) {
    for (const lista of Object.values(archivos)) {
      for (const archivo of lista) {
        await fs.rm(path.resolve('server/uploads', archivo.filename), { force: true });
      }
    }
    next(Object.assign(new Error(`No se pudo optimizar la imagen: ${error.message}`), { status: 400 }));
  }
}

upload.single = (field) => (req, res, next) => {
  singleOriginal(field)(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();
    req.files = { [field]: [req.file] };
    optimizar(req, res, next);
  });
};

upload.fields = (campos) => (req, res, next) => {
  fieldsOriginal(campos)(req, res, (err) => {
    if (err) return next(err);
    optimizar(req, res, next);
  });
};

export default upload;