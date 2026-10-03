import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CLAVE, TemaContext, aplicarTema, leerTema } from './tema';

export default function TemaProvider({ children }) {
  const [tema, setTema] = useState(leerTema);

  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));

  return <TemaContext.Provider value={{ tema, alternar }}>{children}</TemaContext.Provider>;
}

TemaProvider.propTypes = {
  children: PropTypes.node,
};