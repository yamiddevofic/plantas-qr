import { useEffect, useState } from 'react';
import { useHashRoute } from './router';
import PaginaGaleria from './components/pages/PaginaGaleria';
import PaginaDetalle from './components/pages/PaginaDetalle';
import PaginaInicio from './components/pages/PaginaInicio';
import SplashCarga from './components/organisms/SplashCarga';

export default function App() {
  const route = useHashRoute();
  const clavePagina = `${route.nombre}${route.id || ''}`;
  const [transicion, setTransicion] = useState(true);

  useEffect(() => {
    const onChange = () => setTransicion(true);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const temporizador = setTimeout(() => setTransicion(false), 1000);
    return () => clearTimeout(temporizador);
  }, [clavePagina]);

  let pagina = <PaginaInicio />;
  if (route.nombre === 'detalle') {
    pagina = <PaginaDetalle key={route.id} plantaId={route.id} />;
  } else if (route.nombre === 'galeria') {
    pagina = <PaginaGaleria />;
  }

  return (
    <>
      {transicion && <SplashCarga etiqueta="Cargando…" />}
      {pagina}
    </>
  );
}