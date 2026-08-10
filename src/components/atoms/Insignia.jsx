import { abreviarTexto } from '../../constantes';

export default function Insignia({ valor, titulo, clase = 'card-tipo' }) {
  if (!valor) return null;
  return (
    <span className={clase} title={titulo}>
      {abreviarTexto(valor)}
    </span>
  );
}