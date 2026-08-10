import Insignia from '../atoms/Insignia';
import { estadoClass } from '../../constantes';

export default function InsigniasPlanta({ tipo, estado }) {
  return (
    <>
      <Insignia valor={tipo} titulo={tipo} />
      <Insignia valor={estado} titulo={estado} clase={`card-estado ${estadoClass(estado)}`} />
    </>
  );
}