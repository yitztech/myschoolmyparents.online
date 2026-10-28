import type { ClipboardEventHandler, ReactNode } from 'react';

/**
 * §6.3 de la plataforma: al pegar un texto más largo que el máximo del campo,
 * se avisa — no se recorta en silencio. El atributo `maxLength` recorta el
 * valor igualmente; esto solo añade el aviso visible para el pegado (la
 * escritura normal nunca supera el máximo).
 */
export function pasteLimit(
  cap: number,
  avisar: () => void,
): ClipboardEventHandler<HTMLInputElement> {
  return (e) => {
    const pegado = e.clipboardData.getData('text');
    const base = e.currentTarget.value.length;
    if (!pegado || base + pegado.length <= cap) return;
    requestAnimationFrame(() => avisar());
  };
}

/** Aviso de recorte del pegado, accesible (role="alert", §8). */
export function AvisoRecorte({ activo, texto }: { activo: boolean; texto: ReactNode }) {
  if (!activo) return null;
  return <p role="alert" className="mt-1 text-sm font-bold text-coral-deep">{texto}</p>;
}
