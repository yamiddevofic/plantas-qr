import { useEffect, useState } from 'react';
import { LuHouse, LuInfo, LuMapPin, LuMoon, LuSun } from 'react-icons/lu';
import { fetchPlantas } from '../../api';
import SeccionParque from '../organisms/SeccionParque';
import HeroInicio from '../organisms/HeroInicio';
import SeccionContacto from '../molecules/SeccionContacto';
import PopoverContacto from '../molecules/PopoverContacto';
import BotonMenu from '../atoms/BotonMenu';
import ArbolitoLoader from '../atoms/ArbolitoLoader';
import GrupoMenu from '../molecules/GrupoMenu';
import ItemMenu from '../atoms/ItemMenu';
import MenuLateral from '../organisms/MenuLateral';
import PiePagina from '../molecules/PiePagina';
import { useTema } from '../../tema.js';

export default function PaginaInicio() {
  const [datos, setDatos] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { tema, alternar } = useTema();
  const esOscuro = tema === 'oscuro';

  useEffect(() => {
    let cancelado = false;
    fetchPlantas()
      .then((lista) => {
        if (cancelado) return;
        const especies = lista.length;
        const familias = new Set(lista.map((p) => p.familia).filter(Boolean)).size;
        setDatos({ especies, familias });
      })
      .catch(() => { if (!cancelado) setDatos({ especies: 0, familias: 0 }); });
    return () => { cancelado = true; };
  }, []);

  const irASeccion = (id) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuAbierto(false);
  };

  const conocerProyecto = () => {
    document
      .getElementById('acordeon-proyecto')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuAbierto(false);
  };

  return (
    <div className="app">
      <a className="skip-link" href="#app-main">
        Saltar al contenido
      </a>

      <div className="home-acciones">
        <div className="hero-acciones-grupo">
          <BotonMenu abierto={menuAbierto} onClick={() => setMenuAbierto((a) => !a)} />
        </div>
      </div>

      <MenuLateral abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)}>
        <GrupoMenu titulo="Navegación">
          <ItemMenu
            icono={<LuHouse aria-hidden="true" />}
            etiqueta="Inicio"
            descripcion="Conoce el parque y el proyecto"
            pulsado
          />
          <ItemMenu
            icono={<LuMapPin aria-hidden="true" />}
            etiqueta="Nuestro parque"
            descripcion="El corazón verde de Chitagá"
            onClick={irASeccion('acordeon-parque')}
          />
          <ItemMenu
            icono={<LuInfo aria-hidden="true" />}
            etiqueta="Nuestro proyecto"
            descripcion="Identificación de especies con QR"
            onClick={irASeccion('acordeon-proyecto')}
          />
        </GrupoMenu>

        <SeccionContacto />
        <GrupoMenu titulo="Apariencia">
          <ItemMenu
            icono={esOscuro ? <LuMoon aria-hidden="true" /> : <LuSun aria-hidden="true" />}
            etiqueta="Modo oscuro"
            descripcion={
              esOscuro
                ? 'Activado — cambiar a modo claro'
                : 'Desactivado — fondo y textos oscuros'
            }
            pulsado={esOscuro}
            onClick={alternar}
          />
        </GrupoMenu>
      </MenuLateral>

      <main id="app-main">
        <HeroInicio onConocerProyecto={conocerProyecto} />

        {datos ? (
          <SeccionParque especies={datos.especies} familias={datos.familias} abierto />
        ) : (
          <div className="about-cargando">
            <ArbolitoLoader etiqueta="Cargando datos del parque" />
          </div>
        )}
      </main>

      <PiePagina />
      <PopoverContacto />
    </div>
  );
}