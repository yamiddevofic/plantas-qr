import { useEffect, useState } from 'react';
import { useHashRoute } from './router';
import PaginaGaleria from './components/pages/PaginaGaleria';
import PaginaDetalle from './components/pages/PaginaDetalle';
import PaginaEspecies from './components/pages/PaginaEspecies';
import PaginaIndividuos from './components/pages/PaginaIndividuos';
import PaginaInicio from './components/pages/PaginaInicio';
import BarraTitulo from './components/atoms/BarraTitulo';
import AvisoSinConexion from './components/molecules/AvisoSinConexion';
import PuertaAdmin from './components/organisms/PuertaAdmin';
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
    pagina = <PaginaDetalle key={route.id} plantaId={route.id} arbolId={route.arbol} />;
  } else if (route.nombre === 'galeria') {
    pagina = <PaginaGaleria />;
  } else if (route.nombre === 'especies') {
    pagina = <PuertaAdmin titulo="Gestión de especies"><PaginaEspecies /></PuertaAdmin>;
  } else if (route.nombre === 'individuos') {
    pagina = <PuertaAdmin titulo="Gestión de individuos"><PaginaIndividuos /></PuertaAdmin>;
  }

  return (
    <>
      <BarraTitulo />
      {transicion && <SplashCarga etiqueta="Cargando…" />}
      {pagina}
      <AvisoSinConexion />
    </>
  );
}