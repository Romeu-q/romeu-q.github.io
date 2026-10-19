/**
 * Playlist do player de música de fundo.
 *
 * COMO ADICIONAR OU TROCAR FAIXAS
 *  1. Coloque o arquivo .mp3 (~128 kbps) em `public/assets/music/`.
 *  2. Acrescente um item em TRACKS abaixo (o `src` é relativo, sem "/" no início,
 *     porque o `base` do Vite é "./").
 *  3. Use SOMENTE músicas próprias, CC0 / domínio público, ou CC BY (neste caso o
 *     crédito ao autor é obrigatório: preencha `artist`, `license` e `sourceUrl`).
 *
 * As faixas abaixo vêm do Open Lo-Fi (github.com/btahir/open-lofi), coleção
 * em domínio público (CC0 1.0): podem ser hospedadas e usadas livremente, sem
 * crédito obrigatório (damos o crédito mesmo assim).
 */

export type Track = {
  title: string;
  artist: string;
  /** Caminho relativo ao site, ex.: "assets/music/arquivo.mp3". */
  src: string;
  license: string;
  licenseUrl: string;
  /** Página da faixa na fonte original (usada no link de crédito). */
  sourceUrl: string;
};

const CC0 = {
  license: 'CC0 1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
} as const;

const SOURCE = 'https://github.com/btahir/open-lofi';

export const TRACKS: Track[] = [
  {
    title: '2 AM Debug Loop',
    artist: 'Open Lo-Fi',
    src: 'assets/music/2-am-debug-loop.mp3',
    ...CC0,
    sourceUrl: SOURCE,
  },
  {
    title: 'Window Seat Daydream',
    artist: 'Open Lo-Fi',
    src: 'assets/music/window-seat-daydream.mp3',
    ...CC0,
    sourceUrl: SOURCE,
  },
  {
    title: 'First Coffee Thoughts',
    artist: 'Open Lo-Fi',
    src: 'assets/music/first-coffee-thoughts.mp3',
    ...CC0,
    sourceUrl: SOURCE,
  },
  {
    title: 'Pixel Quest Save Point',
    artist: 'Open Lo-Fi',
    src: 'assets/music/pixel-quest-save-point.mp3',
    ...CC0,
    sourceUrl: SOURCE,
  },
  {
    title: 'Terminal Rain',
    artist: 'Open Lo-Fi',
    src: 'assets/music/terminal-rain.mp3',
    ...CC0,
    sourceUrl: SOURCE,
  },
  {
    title: 'Cursor After Midnight',
    artist: 'Open Lo-Fi',
    src: 'assets/music/cursor-after-midnight.mp3',
    ...CC0,
    sourceUrl: SOURCE,
  },
];
