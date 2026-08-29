import QRCode from 'qrcode';
import os from 'os';
import QR from '../models/QR.js';
import Planta from '../models/Planta.js';
import { renderFichaHTML, renderNotFoundFichaHTML } from '../views/fichaTemplate.js';

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  const virtual = /wsl|virtualbox|vmware|hyper-v|vethernet|tailscale|zerotier|docker/i;
  const preferidos = Object.keys(interfaces).filter((name) => !virtual.test(name));
  for (const name of preferidos.length ? preferidos : Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/\/+$/, '');
  }

  const port = process.env.PORT || 3000;
  const hostHeader = req.headers?.host || '';
  const host = hostHeader.replace(/:\d+$/, '');
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);

  if (hostHeader && !isLocal) {
    /* El Host ya trae el puerto público (o ninguno, si es 80/443). Detrás de un
       proxy como Render, PORT es el puerto interno del contenedor —10000— y
       pegarlo aquí generaba QRs hacia http://dominio:10000, que no resuelven.
       El esquema lo dice el proxy en X-Forwarded-Proto. */
    const reenviado = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const esquema = reenviado || req.protocol || 'http';
    return `${esquema}://${hostHeader}`;
  }

  return `http://${getNetworkIP()}:${port}`;
}

export const generarQR = async (req, res) => {
  try {
    const { plantaId } = req.params;
    const planta = await Planta.findById(plantaId);
    if (!planta) return res.status(404).json({ mensaje: 'Planta no encontrada' });

    const url = `${getBaseUrl(req)}/#/planta/${plantaId}`;
    const imagen = await QRCode.toDataURL(url);

    const qrExistente = await QR.findOne({ plantaId });
    if (qrExistente) {
      qrExistente.url = url;
      qrExistente.imagen = imagen;
      const guardado = await qrExistente.save();
      return res.json(guardado);
    }

    const qr = new QR({ plantaId, url, imagen });
    const guardado = await qr.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar QR', error: error.message });
  }
};

export const obtenerQRPorPlanta = async (req, res) => {
  try {
    const qr = await QR.findOne({ plantaId: req.params.plantaId }).populate('plantaId');
    if (!qr) return res.status(404).json({ mensaje: 'QR no encontrado para esta planta' });
    res.json(qr);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener QR', error: error.message });
  }
};

export const verPlantaPorQR = async (req, res) => {
  try {
    const planta = await Planta.findById(req.params.plantaId);
    if (!planta) {
      res.status(404);
      return res.format({
        html() {
          res.send(renderNotFoundFichaHTML());
        },
        json() {
          res.json({ mensaje: 'Planta no encontrada' });
        },
        default() {
          res.json({ mensaje: 'Planta no encontrada' });
        },
      });
    }
    res.format({
      html() {
        res.send(renderFichaHTML(planta));
      },
      json() {
        res.json(planta);
      },
      default() {
        res.json(planta);
      },
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planta', error: error.message });
  }
};

export const generarTodosQR = async (req, res) => {
  try {
    const plantas = await Planta.find();
    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    const resultados = [];

    for (const planta of plantas) {
      try {
        const url = `${getBaseUrl(req)}/#/planta/${planta._id}`;
        const imagen = await QRCode.toDataURL(url);
        const qrExistente = await QR.findOne({ plantaId: planta._id });
        if (qrExistente) {
          qrExistente.url = url;
          qrExistente.imagen = imagen;
          const guardado = await qrExistente.save();
          actualizados++;
          resultados.push(guardado);
        } else {
          const qr = new QR({ plantaId: planta._id, url, imagen });
          const guardado = await qr.save();
          creados++;
          resultados.push(guardado);
        }
      } catch (error) {
        errores++;
        console.error(`Error al generar QR para ${planta._id}:`, error.message);
      }
    }

    res.json({ total: plantas.length, creados, actualizados, errores, resultados });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al regenerar los QRs', error: error.message });
  }
};

export const obtenerTodosQR = async (_req, res) => {
  try {
    const qrs = await QR.find().populate('plantaId');
    res.json(qrs);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener QRs', error: error.message });
  }
};
