// Avisa o player de música que um vídeo vai tocar (ele pausa sozinho).
// Evento no document = os componentes não precisam se conhecer.
export function announceMediaPlay() {
  document.dispatchEvent(new CustomEvent("portfolio:media-play"));
}

// Caminho de um ícone pixel em public/assets/img/pixel/
export const icon = (name: string) => `assets/img/pixel/icon-${name}.svg`;

export const isExternal = (url: string) => /^https?:\/\//.test(url);
