import { createElement, useCallback, useState } from 'react';
import DialogoPassword from '../components/molecules/DialogoPassword';

/**
 * Ejecuta acciones que exigen la contraseña de administrador.
 *
 * `ejecutar(accion, descripcion, { confirmar })` llama a `accion(password)`: si ya
 * hay una contraseña válida en memoria la usa sin preguntar; si no (o si el
 * servidor la rechaza) muestra el diálogo. Con `confirmar: true` (acciones
 * destructivas) siempre se muestra el diálogo, aunque haya contraseña guardada. La contraseña vive solo en memoria mientras la
 * página esté abierta; nunca se guarda en el navegador.
 *
 * Devuelve una promesa con el resultado de `accion`. Si la persona cierra el
 * diálogo se rechaza con un error `cancelado: true`; cualquier otro error de la
 * acción se propaga para que el llamador lo muestre.
 */
export default function useAccionProtegida() {
  const [passwordGuardada, setPasswordGuardada] = useState('');
  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const intentar = useCallback(async (pedido, password) => {
    setCargando(true);
    try {
      const resultado = await pedido.accion(password);
      setPasswordGuardada(password);
      setSolicitud(null);
      setError(null);
      pedido.resolver(resultado);
    } catch (e) {
      if (/contraseña/i.test(e.message)) {
        setPasswordGuardada('');
        setError(e.message);
        setSolicitud(pedido);
      } else {
        setSolicitud(null);
        setError(null);
        pedido.rechazar(e);
      }
    }
    setCargando(false);
  }, []);

  const ejecutar = useCallback((accion, descripcion, { confirmar = false } = {}) => new Promise((resolver, rechazar) => {
    const pedido = { accion, descripcion, resolver, rechazar };
    if (passwordGuardada && !confirmar) {
      intentar(pedido, passwordGuardada);
    } else {
      setError(null);
      setSolicitud(pedido);
    }
  }), [intentar, passwordGuardada]);

  const cancelar = () => {
    solicitud?.rechazar(Object.assign(new Error('Acción cancelada'), { cancelado: true }));
    setSolicitud(null);
    setError(null);
  };

  const dialogo = solicitud
    ? createElement(DialogoPassword, {
      titulo: 'Contraseña requerida',
      descripcion: solicitud.descripcion,
      cargando,
      error,
      onCerrar: cancelar,
      alConfirmar: (password) => intentar(solicitud, password),
    })
    : null;

  return { ejecutar, dialogo };
}
