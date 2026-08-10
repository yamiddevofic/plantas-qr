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

upload.single = (field) => (req, res, next) => {
  singleOriginal(field)(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();
    try {
      const ruta = path.resolve('server/uploads', req.file.filename);
      await optimizarImagen(ruta);
      req.file.filename = `${req.file.filename}.webp`;
      req.file.path = path.join('server', 'uploads', req.file.filename);
      req.file.mimetype = 'image/webp';
      req.file.originalname = req.file.originalname.replace(/\.[^/.]+$/, '') + '.webp';
      next();
    } catch (error) {
      await fs.rm(path.resolve('server/uploads', req.file.filename), { force: true });
      next(Object.assign(new Error(`No se pudo optimizar la imagen: ${error.message}`), { status: 400 }));
    }
  });
};

export default upload;