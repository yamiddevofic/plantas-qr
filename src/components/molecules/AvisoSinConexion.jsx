import { LuWifiOff } from 'react-icons/lu';
import useEnLinea from '../../hooks/useEnLinea';

/** Aviso discreto en toda la app mientras no hay conexión. */
export default function AvisoSinConexion() {
  const enLinea = useEnLinea();
  if (enLinea) return null;
  return (
    <p className="aviso-sin-conexion" role="status">
      <LuWifiOff aria-hidden="true" />
      Sin conexión · mostrando lo guardado en este dispositivo
    </p>
  );
}
