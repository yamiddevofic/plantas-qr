import { useHashRoute } from './router';
import PaginaListado from './components/pages/PaginaListado';
import PaginaDetalle from './components/pages/PaginaDetalle';

export default function App() {
  const route = useHashRoute();

  if (route.nombre === 'detalle') {
    return <PaginaDetalle key={route.id} plantaId={route.id} />;
  }
  return <PaginaListado />;
}