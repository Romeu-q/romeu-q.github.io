// Paleta oficial do site (Pixel art + Frutiger Aero).
// P = cores por nome (para cenas em JS); CHARS = mapa padrão char -> cor usado nos .txt.
export const P = {
  sky: '#7fd3ff',
  skyDeep: '#2fa7e8',
  aqua: '#19c3c9',
  aquaLight: '#8ff0f0',
  leaf: '#6fd64a',
  leafDark: '#2e9a3c',
  ink: '#0b2a4a',
  inkSoft: '#33557a',
  white: '#ffffff',
  cream: '#fff6d6',
  sun: '#ffd23f',
  coral: '#ff7a59',
  pink: '#ff9ec7',
  // rampas extras (sombras / luzes)
  skyPale: '#d8f3ff',
  deep: '#1d7fc0',
  teal: '#0e8a95',
  leafLight: '#b8f28f',
  sunDark: '#e8a317',
  coralDark: '#c8503a',
  pinkDark: '#e06a9a',
  skin: '#f7c8a0',
  skinShade: '#d9966c',
  hair: '#2a1c18',
  hairHi: '#4a3530',
  gray: '#9fb4c8',
  grayDark: '#5d7591',
};

export const CHARS = {
  '.': null, // transparente
  K: P.ink, k: P.inkSoft,
  W: P.white, C: P.cream,
  S: P.sky, s: P.skyPale, B: P.skyDeep, d: P.deep,
  A: P.aqua, a: P.aquaLight, t: P.teal,
  G: P.leaf, g: P.leafDark, l: P.leafLight,
  Y: P.sun, y: P.sunDark,
  O: P.coral, o: P.coralDark,
  P: P.pink, p: P.pinkDark,
  n: P.skin, m: P.skinShade,
  h: P.hair, H: P.hairHi,
  r: P.gray, R: P.grayDark,
};
