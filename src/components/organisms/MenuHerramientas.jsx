import { useState } from 'react';
import {
  LuCirclePlus,
  LuHouse,
  LuImage,
  LuImages,
  LuMoon,
  LuQrCode,
  LuShieldAlert,
  LuSlidersHorizontal,
  LuSun,
} from 'react-icons/lu';
import BarraFiltros from './BarraFiltros';
import GrupoMenu from '../molecules/GrupoMenu';
import ItemMenu from '../atoms/ItemMenu';
import MenuLateral from './MenuLateral';
import SeccionContacto from '../molecules/SeccionContacto';
import { useTema } from '../../tema.js';

/**
 * Organismo que arma el navegador/listado: en escritorio filtros y toolbar
 * visibles; en móvil un menú hamburguesa real (drawer desde la derecha) con
 * grupos (Explorar / Herramientas), "Ver filtros" en acordeón y atajos a
 * las secciones.
 */
export default function MenuHerramientas({
  abierto,
  onCerrar,
  filtros,
  generando,
  puedeGenerar,
  onRegenerarTodos,
  onCrear,
  onEditarImagenes,
  onArchivos,
  onVerEstados,
}) {
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const { tema, alternar } = useTema();
  const esOscuro = tema === 'oscuro';

  return (
    <>
      {filtrosVisibles && (
        <div className="filtros filtros-desktop">
          <BarraFiltros {...filtros} />
        </div>
      )}

      <div className="menu-movil">
        {filtrosVisibles && (
          <div className="menu-filtros-movil" id="menu-filtros-colapsados">
            <h2 className="menu-filtros-titulo">Filtros</h2>
            <BarraFiltros {...filtros} />
          </div>
        )}

        <MenuLateral abierto={abierto} onCerrar={onCerrar}>
          <GrupoMenu titulo="Explorar">
            <ItemMenu
              icono={<LuSlidersHorizontal aria-hidden="true" />}
              etiqueta={filtrosVisibles ? 'Ocultar filtros' : 'Ver filtros'}
              descripcion={
                filtrosVisibles
                  ? 'Contraer búsqueda y selección'
                  : 'Familia y tipo'
              }
              expandido={filtrosVisibles}
              controles="menu-filtros-colapsados"
              onClick={() => {
                setFiltrosVisibles((v) => !v);
                onCerrar();
              }}
            />
            <ItemMenu
              icono={<LuHouse aria-hidden="true" />}
              etiqueta="Inicio"
              descripcion="Conoce el parque y el proyecto"
              onClick={() => {
                window.location.hash = '#/';
                onCerrar();
              }}
            />
          </GrupoMenu>

          <GrupoMenu titulo="Herramientas">
            <ItemMenu
              icono={<LuCirclePlus aria-hidden="true" />}
              etiqueta="Agregar nueva especie"
              descripcion="Registrar una planta en el catálogo"
              onClick={() => {
                onCrear();
                onCerrar();
              }}
            />
            <ItemMenu
              icono={<LuImages aria-hidden="true" />}
              etiqueta="Editar imágenes de especies"
              descripcion="Ver y cambiar las fotos de cada planta"
              onClick={() => {
                onEditarImagenes();
                onCerrar();
              }}
            />
            <ItemMenu
              icono={<LuImage aria-hidden="true" />}
              etiqueta="Archivos de imágenes"
              descripcion="Ver qué planta usa cada archivo y eliminar los sobrantes"
              onClick={() => {
                onArchivos();
                onCerrar();
              }}
            />
            <ItemMenu
              icono={<LuShieldAlert aria-hidden="true" />}
              etiqueta="Estados de conservación"
              descripcion="Ver la escala de colores usada en las fichas"
              onClick={() => {
                onVerEstados?.();
                onCerrar();
              }}
            />
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
            <ItemMenu
              icono={<LuQrCode aria-hidden="true" />}
              etiqueta={generando ? 'Generando QRs…' : 'Generar todos los códigos QR'}
              descripcion="Actualiza los códigos QR de todas las especies"
              disabled={generando || !puedeGenerar}
              onClick={() => {
                onRegenerarTodos();
                onCerrar();
              }}
            />
          </GrupoMenu>

          <SeccionContacto />
        </MenuLateral>
      </div>
    </>
  );
}