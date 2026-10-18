// Decorações procedurais: nuvens (noturnas), bolha, sol, lua, vaga-lume, CD.
// Cada função de cena retorna { name, out, scale, canvas } (ou layers: [{id, canvas}]).
// Para mudar formas, ajuste os círculos/cores abaixo e rode: node tools/pixel2svg.mjs
import { Canvas } from '../lib/canvas.mjs';
import { P } from '../lib/palette.mjs';

const DIR = 'public/assets/img/pixel';
// nuvens de noite: azul-acinzentadas, pouco contraste, semi-transparentes no fim
const CLOUD_BODY = '#5a6d8e';
const CLOUD_EDGE = '#3c4c6c';
const CLOUD_SHADE = '#4b5c7e';
const CLOUD_HI = '#7d92b4';
const CLOUD_ALPHA = 0.55;

function cloud(w, h, puffs, baseY) {
  const c = new Canvas(w, h);
  for (const [x, y, r] of puffs) c.disc(x, y, r, CLOUD_BODY);
  c.rect(puffs[0][0], baseY, puffs[puffs.length - 1][0] - puffs[0][0], h - 1 - baseY - 1, CLOUD_BODY);
  // sombra na parte de baixo + lado direito
  c.recolor((v, x, y) => (y >= h - 4 || (y >= h - 6 && x > w * 0.7) ? CLOUD_SHADE : v));
  c.outline(CLOUD_EDGE);
  // brilhinhos no topo dos puffs
  for (const [x, y, r] of puffs) if (r >= 4) { c.set(x - Math.floor(r / 2), y - Math.floor(r / 2) - 1, CLOUD_HI); c.set(x - Math.floor(r / 2) + 1, y - Math.floor(r / 2) - 1, CLOUD_HI); }
  // tudo opaco até aqui; aplica a transparência de uma vez (sem sobreposição irregular)
  c.recolor(v => `${v}@${CLOUD_ALPHA}`);
  return c;
}

export default function () {
  const out = [];

  out.push({ name: 'cloud-1', out: `${DIR}/cloud-1.svg`, scale: 4,
    canvas: cloud(32, 14, [[5, 9.5, 3], [13, 6.5, 5.4], [22.5, 7.5, 4.4], [28, 10, 2.4]], 8) });
  out.push({ name: 'cloud-2', out: `${DIR}/cloud-2.svg`, scale: 4,
    canvas: cloud(24, 10, [[5, 6.5, 2.6], [10, 4.5, 3.6], [16, 4.8, 3.2], [20, 6.5, 2.2]], 6) });

  // bolha 12x12 translúcida (ajustada p/ fundo navy: aro aqua, miolo bem fraco)
  {
    const c = new Canvas(12, 12);
    const rim = new Canvas(12, 12);
    rim.ring(5.5, 5.5, 5.5, '#000');
    c.disc(5.5, 5.5, 5.5, (x, y) => {
      if (rim.get(x, y)) return x + y < 11 ? '#bff4f6@0.85' : '#3fd0d4@0.8';
      return '#3fd0d4@0.1';
    });
    // aro interno claro embaixo-direita
    for (const [x, y] of [[8, 9], [9, 8], [7, 10], [10, 7]]) if (!rim.get(x, y)) c.px[y * 12 + x] = '#8ff0f0@0.4';
    // brilho principal
    for (const [x, y] of [[3, 2], [4, 2], [2, 3], [2, 4], [3, 3]]) c.px[y * 12 + x] = '#e8f3ff@0.95';
    c.px[2 * 12 + 5] = '#e8f3ff@0.55';
    c.px[5 * 12 + 2] = '#e8f3ff@0.55';
    c.px[8 * 12 + 8] = '#bff4f6@0.7';
    out.push({ name: 'bubble', out: `${DIR}/bubble.svg`, scale: 4, canvas: c });
  }

  // lua 16x16 (cheia, com crateras e halo fraco)
  {
    const c = new Canvas(16, 16);
    const m = new Canvas(16, 16);
    m.sphere(7.5, 7.5, 5.4, 5.4, ['#a9bcd4', '#c8d6e6', '#e2ebf5', '#fbf8ea'], { lx: -0.45, ly: -0.55, dither: true });
    for (const [x, y, col] of [[9, 9, '#a3b5cc'], [10, 9, '#b4c4d8'], [9, 10, '#a9bcd4'], [5, 10, '#b4c4d8'], [6, 11, '#a9bcd4'],
      [10, 5, '#c8d6e6'], [4, 7, '#d0dcea']]) m.set(x, y, col);
    m.set(5, 4, '#ffffff'); m.set(4, 5, '#ffffff');
    m.outline('#6f86a8');
    // halo: anel fraco fora do contorno
    c.disc(7.5, 7.5, 7.4, (x, y) => (m.get(x, y) ? undefined : '#cfe8ff@0.16'));
    c.draw(m);
    out.push({ name: 'moon', out: `${DIR}/moon.svg`, scale: 4, canvas: c });
  }

  // vaga-lume 5x5 (ponto que brilha; o halo pulsa de leve)
  {
    const core = new Canvas(5, 5), halo = new Canvas(5, 5);
    core.set(2, 2, '#fff3c4');
    for (const [x, y] of [[1, 2], [3, 2], [2, 1], [2, 3]]) core.set(x, y, '#ffcb5c@0.85');
    for (const [x, y] of [[1, 1], [3, 1], [1, 3], [3, 3]]) halo.set(x, y, '#ffcb5c@0.35');
    for (const [x, y] of [[0, 2], [4, 2], [2, 0], [2, 4]]) halo.set(x, y, '#ffcb5c@0.22');
    out.push({ name: 'firefly', out: `${DIR}/firefly.svg`, scale: 4,
      layers: [{ id: null, canvas: core }, { id: 'halo', canvas: halo }],
      motion: `#halo{animation:firefly-pulse 2.4s ease-in-out infinite}
@keyframes firefly-pulse{0%,100%{opacity:1}50%{opacity:.3}}` });
  }

  // sol 16x16 fofo
  {
    const c = new Canvas(16, 16);
    const ray = P.sun;
    c.rect(7, 0, 2, 2, ray); c.rect(7, 14, 2, 2, ray); c.rect(0, 7, 2, 2, ray); c.rect(14, 7, 2, 2, ray);
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) c.set(x, y, ray);
    c.sphere(7.5, 7.5, 4.6, 4.6, [P.sunDark, P.sun, '#ffe680', '#fff3b0'], { dither: false });
    c.outline('#e08a10');
    c.set(6, 7, P.ink); c.set(9, 7, P.ink);
    c.set(5, 9, P.pink); c.set(10, 9, P.pink);
    c.set(7, 9, P.coralDark); c.set(8, 9, P.coralDark);
    out.push({ name: 'sun', out: `${DIR}/sun.svg`, scale: 4, canvas: c });
  }

  // CD brilhante 16x16
  {
    const c = new Canvas(16, 16);
    const cx = 7.5, cy = 7.5;
    c.disc(cx, cy, 7.2, (x, y) => {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx); // -pi..pi
      const band = Math.abs(Math.sin(a * 1 - 0.8)); // dois setores opostos
      if (r < 3.2) return r < 2.4 ? P.grayDark : '#e9f0f6';
      if (band < 0.22) return ['#ff9ec7', '#ffd23f', '#8ff0f0', '#7fd3ff'][Math.min(3, Math.floor((r - 3.2) / 1.1))];
      if (band < 0.4) return '#f4f8fb';
      return dy + dx < 0 ? '#d4e0ea' : '#b9c9d8';
    });
    c.outline(P.ink);
    c.disc(cx, cy, 1.2, null); // furo central transparente
    c.set(4, 4, '#ffffff'); c.set(5, 3, '#ffffff');
    out.push({ name: 'cd', out: `${DIR}/cd.svg`, scale: 4, canvas: c });
  }

  return out;
}
