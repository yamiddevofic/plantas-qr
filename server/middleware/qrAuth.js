import crypto from 'crypto';

/**
 * Protege las rutas de generación/regeneración de códigos QR.
 * Compara la contraseña enviada en el cuerpo JSON con ADMIN_PASSWORD
 * del entorno (.env). Si la variable no está configurada, la ruta
 * falla de forma segura (503).
 */
export default function qrAuth(req, res, next) {
  const esperada = process.env.ADMIN_PASSWORD;

  if (!esperada) {
    return res.status(503).json({ mensaje: 'Contraseña de administrador no configurada (ADMIN_PASSWORD)' });
  }

  const enviada = String(req.body?.password ?? '');

  if (!enviada) {
    return res.status(401).json({ mensaje: 'Se requiere la contraseña de administrador' });
  }

  const a = Buffer.from(enviada);
  const b = Buffer.from(esperada);
  const coincide = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!coincide) {
    return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
  }

  next();
}