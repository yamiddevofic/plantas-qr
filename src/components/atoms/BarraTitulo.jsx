/**
 * Barra de título propia para la app instalada en escritorio (modo Window
 * Controls Overlay). Solo se ve en ese modo (ver styles/base.css): ocupa la
 * franja junto a los botones de la ventana y permite arrastrarla.
 */
export default function BarraTitulo() {
  return (
    <div className="barra-titulo" aria-hidden="true">
      <img src="/favicon.svg" alt="" width="16" height="16" />
      <span>PlantaQR</span>
    </div>
  );
}
