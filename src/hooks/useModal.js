import { useEffect, useRef } from 'react';

/**
 * Comportamiento común de los modales de formulario: foco inicial en el
 * diálogo, bloqueo del scroll de la página, cierre con Escape y foco atrapado
 * con Tab. Devuelve la ref que se pone en el contenedor `role="dialog"`.
 */
export default function useModal(onClose) {
  const dialogoRef = useRef(null);

  useEffect(() => {
    dialogoRef.current?.focus();
  }, []);

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const prev = {
      bodyPos: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    const bloquearFuera = (e) => {
      if (dialogoRef.current && !dialogoRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', bloquearFuera, { passive: false });
    document.addEventListener('touchmove', bloquearFuera, { passive: false });

    return () => {
      body.style.position = prev.bodyPos;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.overflow = prev.bodyOverflow;
      html.style.overflow = prev.htmlOverflow;
      document.removeEventListener('wheel', bloquearFuera);
      document.removeEventListener('touchmove', bloquearFuera);
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      // Un diálogo apilado encima (p. ej. la contraseña) atiende su propio Escape.
      const dialogos = document.querySelectorAll('[role="dialog"]');
      if (dialogos[dialogos.length - 1] !== dialogoRef.current) return;
      onClose();
    }
    function onTab(e) {
      if (e.key !== 'Tab') return;
      const contenido = dialogoRef.current;
      if (!contenido) return;
      const enfocables = [...contenido.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      const visibles = enfocables.filter((el) => !el.disabled && el.offsetParent !== null);
      if (visibles.length === 0) return;
      const primero = visibles[0];
      const ultimo = visibles[visibles.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keydown', onTab);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keydown', onTab);
    };
  }, [onClose]);

  return dialogoRef;
}
