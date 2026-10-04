import useRevelar from '../../hooks/useRevelar';
import { IconoArbolPlaca, IconoEscanear, IconoFicha } from '../atoms/IconosInicio';

const PASOS = [
  {
    Icono: IconoArbolPlaca,
    titulo: 'Encuentra un árbol',
    texto: 'Cada árbol del parque lleva una placa con su propio código QR.',
  },
  {
    Icono: IconoEscanear,
    titulo: 'Escanéalo',
    texto: 'Apunta la cámara de tu celular. No necesitas instalar nada.',
  },
  {
    Icono: IconoFicha,
    titulo: 'Descubre su historia',
    texto: 'Familia, origen, usos y estado de conservación en una ficha clara.',
  },
];

/** Los tres pasos del proyecto, con iconos que se dibujan al entrar en pantalla. */
export default function ComoFunciona() {
  const [ref, visible] = useRevelar();

  return (
    <section
      id="como-funciona"
      ref={ref}
      className={`inicio-seccion como-funciona revelar${visible ? ' revelado' : ''}`}
      aria-labelledby="como-funciona-titulo"
    >
      <div className="inicio-cabecera">
        <p className="inicio-eyebrow">Cómo funciona</p>
        <h2 id="como-funciona-titulo" className="inicio-titulo">
          Tres pasos para conocer cada árbol
        </h2>
      </div>

      <ol className="pasos">
        {PASOS.map(({ Icono, titulo, texto }, i) => (
          <li key={titulo} className="paso" style={{ '--i': i }}>
            <span className="paso-icono">
              <Icono />
            </span>
            <div className="paso-cuerpo">
              <span className="paso-numero" aria-hidden="true">0{i + 1}</span>
              <h3 className="paso-titulo">{titulo}</h3>
              <p className="paso-texto">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
