// Galeria (placeholders) 64x64 -> assets/img/art/art-01..06.svg
// Poção, espada, slime, casinha, árvore, gato. O Romeu vai trocar pelas artes reais.
// Cada peça: fundo suave + sombra no chão + objeto desenhado num canvas separado com contorno ink.
import { Canvas, rng } from '../lib/canvas.mjs';
import { P } from '../lib/palette.mjs';

const S = 64, DIR = 'public/assets/img/art';

function bg(top, bottom, floor) {
  const c = new Canvas(S, S);
  c.vbands([top, bottom], 0, S);
  c.ellipse(32, 56, 20, 4, floor);
  // bolhinhas de canto
  c.ring(8, 9, 3, '#ffffff@0.55'); c.set(7, 8, '#ffffff'); c.ring(56, 14, 2, '#ffffff@0.45');
  return c;
}
const done = (name, base, obj) => {
  obj.outline(P.ink);
  base.draw(obj);
  // moldurinha
  base.frame(0, 0, S, S, '#ffffff@0.5');
  return { name, out: `${DIR}/${name}.svg`, scale: 4, canvas: base };
};
const sparkle = (c, x, y) => { c.set(x, y, P.white); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.set(x + dx, y + dy, '#ffffff@0.7'); };

function potion() {
  const b = bg('#ffe6f2', '#ffd0e4', '#f5b3cf');
  const o = new Canvas(S, S);
  const glass = ['#9fdbe6', '#c9f3f7', '#e6fbff'];
  o.rect(27, 12, 10, 14, glass[1]); o.vline(27, 12, 14, glass[0]); o.vline(28, 12, 14, glass[2]);
  o.sphere(32, 38, 16, 16, glass, { dither: false });
  o.rrect(25, 9, 14, 4, 1, glass[0]);
  o.rect(28, 3, 8, 7, '#c98b52'); o.vline(28, 3, 7, '#e0a970'); o.vline(35, 3, 7, '#9a6234'); o.hline(28, 3, 8, '#e0a970');
  // líquido
  o.sphere(32, 38, 14, 14, ['#c0457a', '#e06a9a', P.pink, '#ffd0e4'], { mask: (x, y) => y >= 34 });
  o.ellipse(32, 34, 13, 1, '#ffd0e4');
  for (const [x, y, r] of [[27, 44, 1.6], [36, 40, 1], [33, 47, 1.2], [38, 46, 0.6]]) { o.ring(x, y, r, '#ffe6f2'); }
  // reflexo do vidro
  for (let k = 0; k < 9; k++) o.set(21 + Math.floor(k * 0.4), 32 - k + Math.floor(k * k / 30), P.white);
  o.set(22, 36, P.white); o.set(22, 37, P.white);
  const c = done('art-01', b, o);
  sparkle(c.canvas, 50, 20); sparkle(c.canvas, 14, 26); sparkle(c.canvas, 47, 46);
  return c;
}

function sword() {
  const b = bg('#e2f4ff', '#bfe6fb', '#9fd4ef');
  const o = new Canvas(S, S);
  // eixo diagonal: do cabo (embaixo-esq) até a ponta (cima-dir)
  const ax = 16, ay = 48, ux = Math.SQRT1_2, uy = -Math.SQRT1_2, nx = -uy, ny = ux;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const vx = x + 0.5 - ax, vy = y + 0.5 - ay;
    const u = vx * ux + vy * uy, v = vx * nx + vy * ny;
    // lâmina
    if (u > 6 && u < 46) {
      const w = u > 40 ? 3.2 * (46 - u) / 6 : 3.2;
      if (Math.abs(v) <= w) o.set(x, y, Math.abs(v) < 0.8 ? P.white : v < 0 ? '#e9f3fa' : '#9fb4c8');
    }
    // guarda
    if (u > 3.5 && u <= 6.5 && Math.abs(v) <= 8) o.set(x, y, v < 0 ? '#ffe066' : P.sunDark);
    // cabo
    if (u > -6 && u <= 3.5 && Math.abs(v) <= 1.6) o.set(x, y, Math.round(u) % 3 === 0 ? '#5a3420' : '#8a5a3c');
  }
  o.sphere(ax - 6.5 * ux, ay - 6.5 * uy, 2.8, 2.8, [P.teal, P.aqua, P.aquaLight], { dither: false });
  o.set(Math.round(ax - 7.5 * ux), Math.round(ay - 7.5 * uy) - 1, P.white);
  const c = done('art-02', b, o);
  sparkle(c.canvas, 49, 12); sparkle(c.canvas, 54, 18);
  return c;
}

function slime() {
  const b = bg('#e6fff6', '#c4f5e4', '#9fe3cc');
  const o = new Canvas(S, S);
  o.sphere(32, 46, 21, 19, [P.teal, P.aqua, '#5fe0d0', '#a9f7ea'], { mask: (x, y) => y <= 55 });
  o.hline(13, 55, 38, P.teal);
  // gotinhas
  o.ellipse(12, 52, 2, 3, P.aqua); o.ellipse(52, 53, 1.5, 2, P.aqua);
  // brilho
  o.ellipse(22, 34, 4, 2.5, '#e6fffa'); o.set(29, 31, P.white); o.set(30, 31, P.white);
  // olhos
  for (const ex of [25, 39]) { o.ellipse(ex, 43, 2.6, 3.6, P.ink); o.set(ex - 1, 41, P.white); o.set(ex - 1, 42, P.white); o.set(ex + 1, 45, '#33557a'); }
  o.hline(30, 48, 4, P.ink); o.set(29, 47, P.ink); o.set(34, 47, P.ink);
  o.rect(19, 47, 3, 2, P.pink); o.rect(42, 47, 3, 2, P.pink);
  return done('art-03', b, o);
}

function house() {
  const b = bg('#d8f3ff', '#ffeccc', '#9fd47e');
  const o = new Canvas(S, S);
  o.ellipse(32, 54, 24, 5, P.leaf); o.ellipse(32, 53, 22, 3, '#8ee070');
  // chaminé + fumaça
  o.rect(40, 12, 6, 14, '#b8644a'); o.rect(39, 11, 8, 3, '#8f4a36');
  // paredes
  o.rect(17, 30, 30, 22, P.cream); o.rect(38, 30, 9, 22, '#f0dfb0'); o.hline(17, 51, 30, '#e3cc94');
  // telhado
  o.poly([[12, 31.5], [32, 12], [52, 31.5]], (x, y) => {
    const dark = y % 4 === 3;
    if (x > 32) return dark ? '#a8402c' : P.coralDark;
    return dark ? P.coralDark : P.coral;
  });
  o.line(14, 30, 31, 13, '#ffb199');
  // porta
  o.rect(28, 39, 8, 13, P.aqua); o.vline(28, 39, 13, P.aquaLight); o.rect(28, 39, 8, 1, P.teal); o.set(34, 46, P.sun);
  // janelas
  for (const wx of [19, 40]) { o.rect(wx, 36, 6, 6, P.sky); o.set(wx, 36, P.white); o.set(wx + 1, 36, P.white); o.vline(wx + 3, 36, 6, P.cream); o.hline(wx, 39, 6, P.cream); o.rect(wx - 1, 42, 8, 2, '#8a5a3c'); o.set(wx, 41, P.pink); o.set(wx + 4, 41, P.sun); }
  const c = done('art-04', b, o);
  for (const [x, y, r] of [[45, 7, 2.5], [49, 4, 2], [52, 2, 1.5]]) c.canvas.disc(x, y, r, '#ffffff@0.8');
  return c;
}

function tree() {
  const b = bg('#e8fbe0', '#cdf2c0', '#9fd47e');
  const o = new Canvas(S, S);
  o.rect(28, 34, 8, 22, '#8a5a3c'); o.vline(28, 34, 22, '#b97a4a'); o.vline(34, 34, 22, '#6b4430'); o.vline(35, 34, 22, '#6b4430');
  o.poly([[26, 56], [38, 56], [36, 52], [28, 52]], '#8a5a3c');
  const blobs = [[32, 24, 15], [20, 32, 9], [44, 32, 9], [32, 13, 9], [24, 19, 8], [41, 20, 8]];
  const m = new Canvas(S, S);
  for (const [x, y, r] of blobs) m.disc(x, y, r, '#000000');
  const ramp = ['#1f7a35', P.leafDark, '#4bb83e', P.leaf, P.leafLight];
  const rr = rng(2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!m.get(x, y)) continue;
    // luz por bolha mais próxima (efeito "nuvem de folhas")
    let best = -9;
    for (const [bx, by, br] of blobs) {
      const nx = (x - bx) / br, ny = (y - by) / br, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const v = -0.55 * nx - 0.65 * ny + 0.5 * Math.sqrt(1 - d);
      best = Math.max(best, v);
    }
    const t = Math.max(0, Math.min(0.999, (best + 0.4) / 1.4 + (rr() - 0.5) * 0.12));
    o.set(x, y, ramp[Math.floor(t * ramp.length)]);
  }
  for (const [x, y] of [[22, 22], [38, 12], [44, 28], [30, 30], [18, 30], [34, 20]]) { o.rect(x, y, 2, 2, P.pink); o.set(x, y, P.white); }
  return done('art-05', b, o);
}

function cat() {
  const b = bg('#fff3dc', '#ffe1b8', '#f2c48f');
  const o = new Canvas(S, S);
  const fur = ['#c8602a', '#ef8a3c', '#ffb066', '#ffd29a'];
  // rabo
  for (let k = 0; k < 18; k++) { const a = k / 17 * Math.PI * 0.9; const x = 44 + Math.sin(a) * 9, y = 55 - k * 1.1; o.disc(x, y, 2, k > 14 ? P.cream : fur[1]); }
  o.sphere(32, 46, 13, 11, fur, { mask: (x, y) => y <= 56 });
  o.ellipse(32, 47, 6, 7, P.cream);
  // orelhas
  o.poly([[20, 25], [22, 11], [30, 19]], fur[1]); o.poly([[44, 25], [42, 11], [34, 19]], fur[1]);
  o.poly([[22, 21], [23, 15], [27, 19]], P.pink); o.poly([[42, 21], [41, 15], [37, 19]], P.pink);
  o.sphere(32, 28, 13, 10.5, fur);
  o.ellipse(32, 32, 6, 3.5, P.cream);
  // listras
  for (const dx of [-3, 0, 3]) o.vline(32 + dx, 18, dx ? 3 : 4, fur[0]);
  o.hline(19, 27, 3, fur[0]); o.hline(19, 29, 2, fur[0]); o.hline(42, 27, 3, fur[0]); o.hline(43, 29, 2, fur[0]);
  // olhos
  for (const ex of [26, 38]) { o.rect(ex - 1, 25, 3, 4, P.ink); o.set(ex - 1, 25, P.white); o.set(ex, 25, P.white); }
  o.rect(31, 30, 2, 1, P.pinkDark); o.set(30, 32, P.ink); o.set(31, 33, P.ink); o.set(32, 33, P.ink); o.set(33, 32, P.ink);
  o.rect(22, 31, 2, 1, P.pink); o.rect(40, 31, 2, 1, P.pink);
  // patinhas
  o.ellipse(27, 56, 3.5, 2, P.cream); o.ellipse(37, 56, 3.5, 2, P.cream);
  const c = done('art-06', b, o);
  // bigodes por cima do contorno
  for (const [x0, y0, x1, y1] of [[16, 30, 21, 31], [16, 33, 21, 32], [48, 30, 43, 31], [48, 33, 43, 32]]) c.canvas.line(x0, y0, x1, y1, '#0b2a4a@0.55');
  return c;
}

export default function () {
  return [potion(), sword(), slime(), house(), tree(), cat()];
}
