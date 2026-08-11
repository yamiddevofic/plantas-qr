import { useEffect } from 'react';
import { useHashRoute } from './router';
import PaginaListado from './components/pages/PaginaListado';
import PaginaDetalle from './components/pages/PaginaDetalle';

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.nombre, route.id]);

  if (route.nombre === 'detalle') {
    return <PaginaDetalle key={route.id} plantaId={route.id} />;
  }
  return <PaginaListado />;
}