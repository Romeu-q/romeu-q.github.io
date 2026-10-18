// Camadas do HERO (janela principal) — todas 160x90, empilháveis como parallax.
// Tema: "night Aero" — fim de crepúsculo / noite calma, lua no lugar do sol.
//   hero-sky  : céu noturno em faixas + lua com halo + estrelas (grupos #twinkle-a / #twinkle-b piscam)
//   hero-far  : ilhas/montanhas distantes em azul-esverdeado escuro, janelas/lanternas acesas
//   hero-sea  : mar escuro + coluna de reflexo da lua + linhas de brilho + veleiro com lanterna
//   hero-near : borda de grama escura + folhagens nos cantos (centro-baixo livre p/ o mascote)
//               + vaga-lumes (#firefly-a/b/c) que piscam/flutuam de leve
// Linha do horizonte = HORIZON. Edite números/cores e rode node tools/pixel2svg.mjs
import { Canvas, rng } from '../lib/canvas.mjs';
import { leafShape } from '../lib/kit.mjs';

const W = 160, H = 90, HORIZON = 57;
const DIR = 'public/assets/img/pixel';
const MOON_X = 126, MOON_Y = 19;

// cores quentes (janelas, lanternas, vaga-lumes)
const AMBER = '#ffcb5c', AMBER_HI = '#ffe9a8';

// ilhas distantes: [xCentro, larguraBase/2, altura, tipo]
const ISLANDS = [
  [18, 30, 24, 'mount'], [44, 18, 12, 'green'], [138, 26, 20, 'mount'], [116, 14, 9, 'green'], [158, 12, 14, 'green'],
];
// luzes quentes nas ilhas: [x, y] (o mar reflete cada uma)
const LIGHTS = [[42, 46], [43, 46], [112, 46], [10, 53], [24, 54], [133, 54], [145, 52], [155, 50]];

function sky() {
  const c = new Canvas(W, H);
  c.vbands(['#0b1626', '#0e1a33', '#121f3f', '#17264a', '#1c2d54', '#22385c', '#27465f', '#2b5664', '#2f6669'], 0, HORIZON + 2);
  c.rect(0, HORIZON + 2, W, H - HORIZON - 2, '#2f6669');
  // brilho do horizonte (leve, esverdeado)
  for (let y = HORIZON - 6; y <= HORIZON + 1; y++) c.hline(0, y, W, `#3fd0d4@${(0.03 + (y - HORIZON + 6) * 0.012).toFixed(3)}`);
  // estrelinhas fixas, bem fracas
  const r = rng(7);
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(r() * W), y = Math.floor(Math.pow(r(), 1.3) * 44);
    if (Math.hypot(x - MOON_X, y - MOON_Y) < 15) continue;
    c.set(x, y, i % 5 ? '#c9dcff@0.35' : '#e8f3ff@0.6');
  }
  // nuvens finas de noite (faixas baixas, azul-acinzentadas)
  for (let i = 0; i < 6; i++) {
    const y = 30 + Math.floor(r() * 20), x = Math.floor(r() * W), w = 12 + Math.floor(r() * 26);
    c.hline(x, y, w, '#4a5d82@0.35');
    c.hline(x + 3, y + 1, w - 6, '#3a4c70@0.3');
  }
  // lua com halo suave
  c.disc(MOON_X, MOON_Y, 14, '#cfe8ff@0.05');
  c.disc(MOON_X, MOON_Y, 11, '#cfe8ff@0.08');
  c.disc(MOON_X, MOON_Y, 8.5, '#e8f3ff@0.1');
  c.sphere(MOON_X, MOON_Y, 6.5, 6.5, ['#a9bcd4', '#c8d6e6', '#e2ebf5', '#fbf8ea'], { lx: -0.45, ly: -0.55, dither: true });
  // crateras
  for (const [dx, dy, col] of [[2, 1, '#b4c4d8'], [3, 1, '#b4c4d8'], [2, 2, '#a3b5cc'], [-2, 3, '#b4c4d8'], [-1, 3, '#a9bcd4'],
    [-3, -1, '#d0dcea'], [3, -3, '#c8d6e6'], [1, 4, '#a3b5cc']]) c.set(MOON_X + dx, MOON_Y + dy, col);
  c.set(MOON_X - 3, MOON_Y - 4, '#ffffff'); c.set(MOON_X - 4, MOON_Y - 3, '#ffffff');

  const star = (cv, x, y, big) => {
    cv.set(x, y, '#ffffff');
    cv.set(x - 1, y, '#cfe0ff@0.7'); cv.set(x + 1, y, '#cfe0ff@0.7');
    cv.set(x, y - 1, '#cfe0ff@0.7'); cv.set(x, y + 1, '#cfe0ff@0.7');
    if (big) { cv.set(x - 2, y, '#cfe0ff@0.35'); cv.set(x + 2, y, '#cfe0ff@0.35'); cv.set(x, y - 2, '#cfe0ff@0.35'); cv.set(x, y + 2, '#cfe0ff@0.35'); }
  };
  const a = new Canvas(W, H), b = new Canvas(W, H);
  star(a, 14, 8, true); star(a, 70, 14, false); star(a, 98, 5, true); star(a, 150, 40, false); star(a, 42, 30, false);
  star(b, 36, 18, false); star(b, 58, 6, true); star(b, 86, 24, false); star(b, 148, 6, true); star(b, 6, 26, false);
  return {
    name: 'hero-sky', out: `${DIR}/hero-sky.svg`, scale: 4, stack: 'hero',
    layers: [{ id: null, canvas: c }, { id: 'twinkle-a', canvas: a }, { id: 'twinkle-b', canvas: b }],
    motion: `#twinkle-a{animation:hero-tw 3s ease-in-out infinite}
#twinkle-b{animation:hero-tw 3s ease-in-out -1.5s infinite}
@keyframes hero-tw{0%,100%{opacity:1}50%{opacity:.15}}`,
  };
}

function far() {
  const c = new Canvas(W, H);
  const r = rng(3);
  for (const [cx, hw, hgt, kind] of ISLANDS) {
    const top = HORIZON - hgt;
    if (kind === 'mount') {
      // montanha azul-noite com lado iluminado pela lua (à direita)
      const peak = cx + Math.round((r() - 0.5) * 6);
      const pts = [[cx - hw, HORIZON + 1]];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, x = cx - hw + t * hw * 2;
        const prof = 1 - Math.pow(Math.abs(x - peak) / hw, 1.35);
        pts.push([x, HORIZON - Math.max(0, prof) * hgt + (i % 3 === 1 ? 1 : 0)]);
      }
      pts.push([cx + hw, HORIZON + 1]);
      c.poly(pts, (x, y) => {
        const lit = x > peak + (y - top) * 0.15;
        const hz = (y - top) / hgt; // névoa embaixo
        if (hz > 0.78) return lit ? '#264f60' : '#1f4255';
        return lit ? '#22405e' : '#182f4a';
      });
      // luar no pico
      c.set(peak, top + 1, '#4f7396'); c.set(peak + 1, top + 1, '#4f7396'); c.set(peak + 1, top + 2, '#3a5c7e');
    } else {
      // ilha azul-esverdeada com copas
      const base = new Canvas(W, H);
      const BODY = '#163f3e';
      base.ellipse(cx, HORIZON, hw, hgt * 0.75, BODY);
      for (let i = 0; i < hw / 2.5; i++) {
        const x = cx - hw * 0.7 + r() * hw * 1.4;
        const rr = 2 + r() * 2.5;
        const yy = HORIZON - Math.sqrt(Math.max(0, 1 - ((x - cx) / hw) ** 2)) * hgt * 0.75;
        base.disc(x, yy + 1, rr, BODY);
      }
      base.recolor((v, x, y) => {
        if (y >= HORIZON) return BODY;
        if (!base.get(x, y - 1)) return '#2e6a5e';
        if (!base.get(x + 1, y) || !base.get(x, y - 2)) return '#225548';
        return (x + y) % 7 === 0 ? '#12353a' : BODY;
      });
      // palmeirinha
      if (hw >= 14) {
        const px = cx + 3, py = Math.round(HORIZON - hgt * 0.75);
        base.line(px, py, px - 1, py - 6, '#0e2a2c');
        for (const [dx, dy] of [[-4, 1], [4, 1], [-3, -1], [3, -1]]) base.line(px - 1, py - 6, px - 1 + dx, py - 6 + dy, '#1a4a44');
      }
      c.draw(base);
    }
  }
  // casinha na ilha da esquerda (janela acesa)
  c.rect(41, 45, 7, 4, '#102a30');
  c.poly([[40, 45], [44, 41], [48.5, 45]], '#0d2228');
  c.line(40, 45, 44, 41, '#2f5560'); c.line(44, 41, 48, 45, '#2f5560'); // beiral ao luar
  c.vline(45, 46, 3, '#1d3a40'); // porta
  c.vline(46, 41, 2, '#0d2228'); // chaminé
  // lanterna na ilha do meio-direita
  c.vline(112, 47, 4, '#0d2228');
  // halos + luzes
  for (const [x, y] of LIGHTS) c.disc(x, y, 2, `${AMBER}@0.14`);
  for (const [x, y] of LIGHTS) c.set(x, y, AMBER);
  c.set(112, 45, AMBER_HI); c.set(112, 46, AMBER);
  return { name: 'hero-far', out: `${DIR}/hero-far.svg`, scale: 4, stack: 'hero', canvas: c };
}

function sea() {
  const c = new Canvas(W, H);
  const bands = [[HORIZON, '#2b5a68'], [HORIZON + 2, '#224a5e'], [HORIZON + 5, '#1b3d55'], [HORIZON + 9, '#16334c'],
    [HORIZON + 14, '#122b44'], [HORIZON + 21, '#0f243c'], [HORIZON + 28, '#0c1d33']];
  bands.forEach(([y, col], i) => {
    const y1 = i + 1 < bands.length ? bands[i + 1][0] : H;
    c.rect(0, y, W, y1 - y, col);
    if (i > 0) for (let x = 0; x < W; x += 2) c.set(x + (y % 2), y, bands[i - 1][1]); // dither na borda
  });
  // espuma suave na base das ilhas
  for (const [cx, hw] of ISLANDS) for (let x = cx - hw + 2; x < cx + hw - 2; x++) if (x % 3) c.set(x, HORIZON, '#7fb8c8@0.35');
  // linhas de brilho (poucas, discretas)
  const r = rng(11);
  for (let i = 0; i < 46; i++) {
    const y = HORIZON + 2 + Math.floor(Math.pow(r(), 1.4) * (H - HORIZON - 3));
    const depth = (y - HORIZON) / (H - HORIZON);
    const len = 2 + Math.floor(r() * (3 + depth * 8));
    const x = Math.floor(r() * W);
    c.hline(x, y, len, r() < 0.5 ? '#8fb8d8@0.28' : '#3fd0d4@0.22');
  }
  // reflexos quentes das luzes (tracinhos verticais quebrados)
  for (const [x] of LIGHTS) for (let k = 0; k < 4; k++) if ((x + k) % 3 !== 0) c.set(x, HORIZON + 1 + k * 2, `${AMBER}@${(0.5 - k * 0.1).toFixed(2)}`);
  // coluna de reflexo da lua
  for (let y = HORIZON + 1, k = 0; y < H - 2; y += 2, k++) {
    const w = Math.max(2, 9 - Math.floor(k / 2)) + (k % 2) * 2;
    const x = MOON_X - Math.floor(w / 2) + ((k * 3) % 3) - 1;
    c.hline(x - 1, y, w + 2, '#cfe8ff@0.12');
    c.hline(x, y, w, k % 3 === 0 ? '#fbf8ea@0.75' : '#cfe8ff@0.5');
  }
  // veleiro (silhueta noturna + lanterna no mastro)
  const bx = 70, by = HORIZON;
  c.poly([[bx - 4, by - 1], [bx + 5, by - 1], [bx + 3, by + 1], [bx - 2, by + 1]], '#2a1f33');
  c.hline(bx - 3, by - 1, 8, '#4a3a52');
  c.vline(bx, by - 9, 8, '#0b1626');
  c.poly([[bx + 1, by - 9], [bx + 1, by - 2], [bx + 6, by - 2]], '#8ea6c4');
  c.poly([[bx - 1, by - 7], [bx - 1, by - 2], [bx - 4, by - 2]], '#5f7696');
  c.disc(bx, by - 10, 2, `${AMBER}@0.18`);
  c.set(bx, by - 10, AMBER);
  c.hline(bx - 4, by + 2, 10, '#8fb8d8@0.25');
  c.set(bx, by + 3, `${AMBER}@0.35`); c.set(bx, by + 5, `${AMBER}@0.2`);
  return { name: 'hero-sea', out: `${DIR}/hero-sea.svg`, scale: 4, stack: 'hero', canvas: c };
}

function near() {
  const c = new Canvas(W, H);
  const r = rng(5);
  const EDGE = '#0b2418';
  const G_LIT = '#3f8a52', G = '#245c3a', G_DK = '#1a4a30';
  // borda de grama: topo ondulado nas laterais, plano no centro (palco do mascote)
  const topY = x => {
    const d = Math.abs(x - 80);
    if (d < 34) return 79;
    return Math.round(79 - Math.min(6, (d - 34) * 0.18) + Math.sin(x * 0.35) * 1.2);
  };
  for (let x = 0; x < W; x++) {
    const t = topY(x);
    for (let y = t; y < H; y++) {
      const k = y - t;
      let col;
      if (k === 0) col = EDGE;
      else if (k === 1) col = G_LIT;
      else if (k < 5) col = G;
      else if (k < 7) col = (x + y) % 2 ? G_DK : G;
      else if (k === 7) col = EDGE;
      else col = k % 4 === 0 && (x * 7 + y) % 5 === 0 ? '#4a3426' : (k < 10 ? '#33241a' : '#271b14');
      c.set(x, y, col);
    }
  }
  // pedrinhas na terra
  for (let i = 0; i < 18; i++) { const x = Math.floor(r() * W), y = 88 + Math.floor(r() * 2); c.rect(x, y, 2, 1, '#1a120c'); }
  // tufos de grama (fora do centro)
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * W);
    if (Math.abs(x - 80) < 26) continue;
    const t = topY(x);
    c.set(x, t - 1, EDGE); c.set(x + 1, t - 2, EDGE); c.set(x + 2, t - 1, EDGE);
    c.set(x + 1, t - 1, G);
  }
  // florzinhas (tons apagados de noite)
  const PINK = '#c46a94', MOONW = '#cfe0ff';
  for (const [x, col] of [[30, PINK], [44, AMBER], [118, PINK], [131, AMBER], [61, MOONW], [101, MOONW]]) {
    const t = topY(x);
    c.set(x, t - 2, col); c.set(x - 1, t - 2, col); c.set(x + 1, t - 2, col); c.set(x, t - 3, col); c.set(x, t - 1, EDGE);
    c.set(x, t - 2, col === AMBER ? '#e08a3a' : '#e8c46a');
  }

  // folhagem canto esquerdo (folhas tipo palmeira), luz da lua vem da direita
  const leafCol = { light: '#2f7044', dark: '#1d4c30', rib: '#133624' };
  const L = new Canvas(W, H);
  leafShape(L, 6, 88, -4, 44, 6, leafCol);
  leafShape(L, 8, 88, 16, 46, 6, leafCol);
  leafShape(L, 10, 88, 34, 62, 5.5, leafCol);
  leafShape(L, 4, 88, -6, 64, 5, leafCol);
  leafShape(L, 12, 88, 40, 78, 4.5, leafCol);
  L.outline(EDGE);
  c.draw(L);
  // arbusto canto direito + folhas
  const R = new Canvas(W, H);
  leafShape(R, 152, 88, 162, 50, 6, leafCol);
  leafShape(R, 150, 88, 136, 56, 5.5, leafCol);
  const BUSH = '#1f5234';
  for (const [x, y, rr] of [[146, 80, 7], [156, 76, 8], [136, 84, 5], [160, 84, 6]]) R.disc(x, y, rr, BUSH);
  R.recolor((v, x, y) => {
    if (v !== BUSH) return v;
    if (!R.get(x, y - 1) || !R.get(x - 1, y)) return '#3f8a52';
    if (!R.get(x, y - 2)) return '#2f7044';
    return (x * 3 + y * 5) % 11 === 0 ? '#153d28' : BUSH;
  });
  R.outline(EDGE);
  for (const [x, y, col] of [[144, 76, PINK], [154, 71, AMBER], [150, 82, PINK], [158, 79, MOONW]]) {
    R.set(x, y, col); R.set(x + 1, y, col); R.set(x, y + 1, col); R.set(x + 1, y + 1, col === AMBER ? '#e08a3a' : '#e8c46a');
  }
  c.draw(R);

  // vaga-lumes: 3 grupos que acendem/apagam em tempos diferentes e sobem 1px
  const fly = (cv, x, y) => {
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cv.set(x + dx, y + dy, `${AMBER}@0.18`);
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) cv.set(x + dx, y + dy, `${AMBER}@0.12`);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) cv.set(x + dx, y + dy, `${AMBER}@0.45`);
    cv.set(x, y, AMBER_HI);
  };
  const fa = new Canvas(W, H), fb = new Canvas(W, H), fcv = new Canvas(W, H);
  fly(fa, 22, 62); fly(fa, 140, 64); fly(fa, 38, 73);
  fly(fb, 12, 70); fly(fb, 128, 58); fly(fb, 150, 67);
  fly(fcv, 30, 55); fly(fcv, 120, 70); fly(fcv, 44, 64);
  return {
    name: 'hero-near', out: `${DIR}/hero-near.svg`, scale: 4, stack: 'hero',
    layers: [{ id: null, canvas: c }, { id: 'firefly-a', canvas: fa }, { id: 'firefly-b', canvas: fb }, { id: 'firefly-c', canvas: fcv }],
    motion: `#firefly-a{animation:hero-ff 4.2s ease-in-out infinite}
#firefly-b{animation:hero-ff 5s ease-in-out -1.6s infinite}
#firefly-c{animation:hero-ff 3.6s ease-in-out -2.8s infinite}
@keyframes hero-ff{0%,100%{opacity:.15;transform:translate(0,0)}45%{opacity:1;transform:translate(0,-1px)}70%{opacity:.8;transform:translate(1px,-1px)}}`,
  };
}

export default function () {
  return [sky(), far(), sea(), near()];
}
