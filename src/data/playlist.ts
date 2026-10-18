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
 * As faixas abaixo são CC0 (HoliznaCC0, Free Music Archive). O FMA exige login
 * para baixar, então os arquivos NÃO vêm no repositório: veja
 * `public/assets/music/LEIA-ME.md`. Enquanto não existirem, o player avisa com
 * uma mensagem calma, sem quebrar nada.
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

export const TRACKS: Track[] = [
  {
    title: 'Calm Currents',
    artist: 'HoliznaCC0',
    src: 'assets/music/calm-currents.mp3',
    ...CC0,
    sourceUrl:
      'https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/calm-currents-lofi-relax-calm/',
  },
  {
    title: 'Peaceful Drift',
    artist: 'HoliznaCC0',
    src: 'assets/music/peaceful-drift.mp3',
    ...CC0,
    sourceUrl:
      'https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/peaceful-drift-lofi-nostalgic-calm/',
  },
  {
    title: 'Tokyo Sunset',
    artist: 'HoliznaCC0',
    src: 'assets/music/tokyo-sunset.mp3',
    ...CC0,
    sourceUrl:
      'https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tokyo-sunset-lofi-peaceful-soft/',
  },
  {
    title: 'Morning Coffee',
    artist: 'HoliznaCC0',
    src: 'assets/music/morning-coffee.mp3',
    ...CC0,
    sourceUrl: 'https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/morning-coffee/',
  },
];
