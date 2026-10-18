// Miniaturas dos projetos — 160x100, opacas, render 640x400 (scale 4).
// Cada função desenha uma cena; no fim aplicamos moldura + brilho Aero (camada "gloss").
// Para criar uma nova: copie uma função, mude nome/cores e adicione na lista do final.
import { Canvas, rng, textWidth } from '../lib/canvas.mjs';
import { P } from '../lib/palette.mjs';
import { aeroFrame, aeroGloss, aeroWindow, mini } from '../lib/kit.mjs';

const W = 160, H = 100, DIR = 'public/assets/img/thumbs';

function finish(name, c, { gloss = 0.2, inner } = {}) {
  aeroFrame(c, inner ? { inner } : undefined);
  return { name, out: `${DIR}/${name}.svg`, scale: 4, layers: [{ id: null, canvas: c }, { id: 'gloss', canvas: aeroGloss(W, H, { strength: gloss }) }] };
}

// ------------------------------------------------------------------ VERITY
function verity() {
  const c = new Canvas(W, H);
  c.vbands(['#2a1f4f', '#3a2862', '#523272', '#6e3a7a', '#8f437c', '#b25177', '#d1626f', '#ec7b66', '#ff9a62', '#ffb86a'], 0, 74);
  const r = rng(21);
  for (let i = 0; i < 22; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * 26); c.set(x, y, i % 4 ? '#e9d6ff@0.6' : '#fff0f6'); }
  // sol poente com listras
  c.disc(118, 70, 22, '#ffb86a@0.25');
  c.ellipse(118, 70, 15.5, 15.5, (x, y) => {
    if (y > 58 && (y % 3 === 0)) return undefined;
    const t = (y - 55) / 16;
    return t < 0.3 ? '#ffe28a' : t < 0.6 ? '#ffc070' : '#ff9a5a';
  });
  // colinas distantes
  for (let x = 0; x < W; x++) {
    const h1 = 66 + Math.round(Math.sin(x * 0.045) * 3 + Math.sin(x * 0.13 + 1) * 1.5);
    c.vline(x, h1, 74 - h1, '#5a2f60');
    const h2 = 71 + Math.round(Math.sin(x * 0.07 + 2) * 2);
    c.vline(x, h2, 76 - h2, '#3e2350');
  }
  // chão + estrada
  c.rect(0, 76, W, H - 76, '#1b1028');
  c.rect(0, 80, W, 9, '#2a1d3a');
  c.hline(0, 80, W, '#3a2a4a');
  for (let x = 2; x < W; x += 11) c.hline(x, 84, 6, '#8a5068');
  // postes + fios
  const poles = [12, 62, 112, 158];
  const wires = [[-6, 31], [6, 31], [-4, 36]];
  for (let i = 0; i + 1 < poles.length; i++)
    for (const [dx, dy] of wires) c.wire(poles[i] + dx, dy, poles[i + 1] + dx, dy, 6, '#160c22');
  for (const [dx, dy] of wires) c.wire(-30 + dx, dy - 2, poles[0] + dx, dy, 6, '#160c22');
  for (const x of poles) {
    c.rect(x - 1, 28, 2, 52, '#140a1f');
    c.rect(x - 8, 30, 16, 2, '#140a1f');
    c.rect(x - 5, 35, 10, 1, '#140a1f');
    for (const dx of [-6, 6, -4]) c.set(x + dx, 29, '#140a1f');
  }
  // pássaros
  for (const [x, y] of [[40, 16], [46, 13], [52, 18]]) { c.set(x, y, '#2a1838'); c.set(x - 1, y - 1, '#2a1838'); c.set(x + 1, y - 1, '#2a1838'); }
  // ambulância (silhueta, de lado, virada pra direita)
  const S = '#0e0818';
  c.rect(26, 62, 36, 21, S); // baú
  c.rect(61, 68, 13, 15, S); // cabine
  c.poly([[61, 68], [69, 68], [75, 75], [75, 83], [61, 83]], S);
  c.rect(30, 60, 28, 2, S); // teto
  c.rect(64, 70, 6, 5, '#4a2a3a'); // janela da cabine (reflexo do pôr do sol)
  c.poly([[70, 70], [72, 70], [74, 75], [70, 75]], '#5b2f40');
  c.hline(64, 70, 6, '#7a3f4a');
  c.rect(30, 66, 8, 6, '#2a1830'); // janela traseira apagada
  c.rect(42, 70, 12, 2, '#24142c'); c.rect(47, 66, 2, 10, '#24142c'); // cruz quase invisível
  c.disc(36, 84, 4, S); c.disc(66, 84, 4, S);
  c.disc(36, 84, 1.5, '#3a2a4a'); c.disc(66, 84, 1.5, '#3a2a4a');
  // giroflex + farol
  c.set(44, 59, '#ff3d5a'); c.set(45, 59, '#ff3d5a'); c.set(47, 59, '#4a9dff'); c.set(48, 59, '#4a9dff');
  c.disc(44.5, 59, 3, '#ff3d5a@0.25'); c.disc(47.5, 59, 3, '#4a9dff@0.2');
  c.set(74, 78, '#ffe6a0');
  c.poly([[75, 77], [110, 72], [110, 88], [75, 80]], '#ffe6a0@0.12');
  return finish('verity', c, { gloss: 0.12 });
}

// ------------------------------------------------------------------ RITMO (DAW de patterns: Rust + Tauri + React)
// Cores da marca Ritmo: fundo #101216/#1a1e24, verde #3ddc97, âmbar #ffb347.
function ritmo() {
  const BG = '#101216', PANEL = '#1a1e24', PANEL2 = '#22272f', LINE = '#2a3039', LINE2 = '#353c47';
  const TXT = '#c8d0da', DIM = '#6b7480';
  const GRN = '#3ddc97', GRN_DK = '#23a06c', GRN_HI = '#9ff0c9', AMB = '#ffb347', AMB_DK = '#c9822a', CLIP = '#ff6b6b';
  const c = new Canvas(W, H, BG);
  // barra superior (transporte)
  c.rect(2, 2, W - 4, 11, PANEL); c.hline(2, 2, W - 4, LINE2); c.hline(2, 13, W - 4, '#0a0b0e');
  c.text('RITMO', 6, 5, GRN);
  c.poly([[33, 4], [33, 11], [38, 7.5]], GRN); // play
  c.rect(41, 5, 5, 5, DIM); // stop
  c.rect(49, 5, 5, 5, AMB); c.set(49, 5, PANEL); c.set(53, 5, PANEL); c.set(49, 9, PANEL); c.set(53, 9, PANEL); // rec
  c.rect(58, 4, 22, 7, '#0a0b0e'); c.text('128', 63, 5, GRN);
  c.rect(83, 4, 30, 7, '#0a0b0e');
  for (let i = 0; i < 14; i++) { const v = Math.floor(Math.abs(Math.sin(i * 0.9 + 0.4)) * 5); c.vline(85 + i * 2, 9 - v, 1 + v, i < 10 ? GRN : AMB); }
  c.text('PAT 01', 118, 5, TXT);
  c.rect(144, 4, 12, 7, PANEL2); c.rect(146, 6, 3, 3, GRN); c.rect(151, 6, 3, 3, DIM);

  // piano roll (topo esquerdo)
  const PX = 18, PY = 16, PW = 90, rows = 14, rh = 3;
  const black = [1, 3, 6, 8, 10];
  for (let i = 0; i < rows; i++) {
    const y = PY + i * rh, isB = black.includes(i % 12);
    c.rect(4, y, 13, rh, '#d9dee5'); c.hline(4, y + rh - 1, 13, '#9aa3ae');
    if (isB) c.rect(4, y, 8, rh - 1, '#15181d');
    c.rect(PX, y, PW, rh, isB ? '#15181d' : PANEL);
  }
  for (let x = 0; x < PW; x += 6) c.vline(PX + x, PY, rows * rh, x % 24 === 0 ? LINE2 : LINE);
  const notes = [[2, 0, 9], [4, 12, 6], [6, 18, 9], [2, 30, 6], [1, 36, 12], [4, 48, 6], [7, 54, 9], [6, 66, 6], [4, 72, 15],
    [10, 0, 18, 1], [9, 24, 18, 1], [11, 48, 18, 1], [10, 72, 18, 1]];
  for (const [row, x, len, alt] of notes) {
    const y = PY + row * rh, col = alt ? AMB : GRN;
    c.rect(PX + x, y, len - 1, rh - 1, col);
    c.hline(PX + x, y, len - 1, alt ? '#ffd79a' : GRN_HI);
    c.set(PX + x + len - 2, y + 1, alt ? AMB_DK : GRN_DK);
  }
  // cabeça de leitura
  c.vline(PX + 40, PY - 1, rows * rh + 1, AMB); c.set(PX + 39, PY - 1, AMB); c.set(PX + 41, PY - 1, AMB);

  // step sequencer (embaixo esquerdo)
  const SY = 62;
  c.rect(2, SY - 2, 108, 36, PANEL); c.hline(2, SY - 2, 108, LINE2);
  const chans = [['KICK', [0, 4, 8, 12], GRN], ['SNARE', [4, 12], AMB], ['HAT', [0, 2, 4, 6, 8, 10, 12, 14], GRN], ['CLAP', [7, 15], AMB]];
  chans.forEach(([lbl, on, col], j) => {
    const y = SY + j * 8;
    c.rect(4, y, 20, 7, PANEL2); c.text(lbl, 5, y + 1, TXT);
    c.set(22, y + 3, j === 0 ? GRN : DIM); // led do canal
    for (let i = 0; i < 16; i++) {
      const x = 26 + i * 5, lit = on.includes(i);
      const off = Math.floor(i / 4) % 2 ? '#262b33' : '#2f3540';
      c.rect(x, y, 4, 7, lit ? col : off);
      c.hline(x, y, 4, lit ? '#ffffff@0.45' : '#ffffff@0.06');
      if (lit) c.hline(x, y + 6, 4, col === GRN ? GRN_DK : AMB_DK);
    }
  });
  // passo atual (coluna 8) destacado
  for (let j = 0; j < 4; j++) c.set(26 + 8 * 5 + 1, SY + j * 8 + 7, AMB);

  // mixer (direita)
  c.rect(112, 16, 44, 80, PANEL); c.frame(112, 16, 44, 80, LINE2);
  c.text('MIX', 114, 18, DIM);
  const lv = [0.82, 0.55, 0.7, 0.38, 0.92];
  lv.forEach((v, i) => {
    const x = 115 + i * 8;
    c.disc(x + 2, 28, 1.6, '#4a525e'); c.set(x + 2, 27, TXT); // knob de pan
    c.vline(x + 2, 34, 54, '#0a0b0e');
    const top = Math.round(88 - v * 52);
    for (let y = top; y < 89; y++) { const t = (89 - y) / 52; c.set(x + 5, y, t > 0.86 ? CLIP : t > 0.62 ? AMB : GRN); }
    c.vline(x + 6, top, 89 - top, '#ffffff@0.08');
    const fy = Math.round(38 + (1 - v) * 40);
    c.rect(x, fy, 5, 3, '#aab3be'); c.hline(x, fy, 5, '#e8edf2'); c.hline(x, fy + 2, 5, '#5f6874');
    c.rect(x + 1, 91, 3, 2, i === 0 ? GRN : PANEL2); // mute/solo
  });
  return finish('ritmo', c, { gloss: 0.1, inner: LINE2 });
}

// ------------------------------------------------------------------ INSTANCER
function instancer() {
  const c = new Canvas(W, H);
  c.vbands([P.skyDeep, '#4ab6ef', P.sky, '#a8e4ff', '#c9f0ff'], 0, H);
  const r = rng(4);
  for (let i = 0; i < 9; i++) { const x = 4 + r() * 152, y = 4 + r() * 92, rr = 1 + r() * 3; c.ring(x, y, rr, '#ffffff@0.6'); c.set(Math.floor(x - rr / 2), Math.floor(y - rr / 2), '#ffffff@0.9'); }
  // janela grande: paisagem
  const a = aeroWindow(c, 6, 8, 88, 82);
  c.vbands(['#5fc3f5', '#8fd8fb', '#c4effc'], a.y, a.y + 44, { x0: a.x, x1: a.x + a.w });
  c.rect(a.x, a.y + 44, a.w, a.h - 44, P.leaf);
  c.ellipse(a.x + 20, a.y + 48, 30, 10, '#4bb83e'); c.ellipse(a.x + 66, a.y + 50, 34, 12, P.leafDark);
  c.ellipse(a.x + 20, a.y + 48, 30, 10, (x, y) => (y < a.y + 44 ? '#5ccc48' : undefined));
  c.disc(a.x + 70, a.y + 12, 6, P.sun); c.disc(a.x + 70, a.y + 12, 4, '#fff0a0');
  c.rect(a.x + 18, a.y + 30, 3, 14, '#8a5a3c'); c.disc(a.x + 19, a.y + 26, 7, P.leafDark); c.disc(a.x + 18, a.y + 25, 5, P.leaf); c.set(a.x + 16, a.y + 22, P.leafLight);
  for (const [x, y] of [[a.x + 30, a.y + 12], [a.x + 44, a.y + 8]]) { c.rect(x, y, 10, 3, P.white); c.rect(x + 2, y - 2, 5, 2, P.white); }
  c.rect(a.x + 40, a.y + 52, 8, 6, P.cream); c.poly([[a.x + 38, a.y + 52], [a.x + 44, a.y + 47], [a.x + 50, a.y + 52]], P.coral); c.rect(a.x + 43, a.y + 55, 2, 3, P.skyDeep);
  // 3 janelas pequenas
  const s1 = aeroWindow(c, 102, 8, 52, 24, { address: false, bar: 5 });
  const cols = [P.coral, P.sun, P.leaf, P.aqua, P.pink, P.skyDeep];
  cols.forEach((col, i) => { const x = s1.x + 3 + (i % 3) * 16, y = s1.y + 2 + Math.floor(i / 3) * 9; c.rect(x, y, 14, 7, col); c.hline(x, y, 14, '#ffffff@0.5'); });
  const s2 = aeroWindow(c, 102, 38, 52, 24, { address: false, bar: 5 });
  c.hline(s2.x + 3, s2.y + s2.h - 3, s2.w - 6, P.inkSoft);
  [6, 10, 7, 13, 9, 15].forEach((h, i) => { c.rect(s2.x + 5 + i * 7, s2.y + s2.h - 3 - h, 5, h, i % 2 ? P.aqua : P.skyDeep); c.vline(s2.x + 5 + i * 7, s2.y + s2.h - 3 - h, h, '#ffffff@0.4'); });
  const s3 = aeroWindow(c, 102, 68, 52, 22, { address: false, bar: 5 });
  c.rect(s3.x + 3, s3.y + 2, 12, 11, '#ffe0ef'); mini(c, 'heart', s3.x + 5, s3.y + 4);
  [24, 30, 20, 28].forEach((w, i) => c.hline(s3.x + 18, s3.y + 3 + i * 3, w, i ? P.gray : P.inkSoft));
  return finish('instancer', c);
}

// ------------------------------------------------------------------ DELIVERY IA
function deliveryIa() {
  const c = new Canvas(W, H);
  c.vbands([P.cream, '#fdf1d0', '#eaf7ff', '#d8f3ff'], 0, H);
  // janela de chat
  const a = aeroWindow(c, 8, 8, 78, 84, { address: false, bar: 9 });
  c.disc(a.x + 66, 12, 2.5, P.white); c.set(a.x + 65, 12, P.ink); c.set(a.x + 67, 12, P.ink); c.text('IA', a.x + 52, 10, P.white);
  const bubble = (x, y, w, h, col, right) => {
    c.rrect(x, y, w, h, 1, col);
    if (right) { c.set(x + w - 2, y + h, col); c.set(x + w - 1, y + h + 1, col); } else { c.set(x + 1, y + h, col); c.set(x, y + h + 1, col); }
  };
  bubble(a.x + 3, a.y + 4, 50, 14, '#c9f6f4', false);
  c.hline(a.x + 7, a.y + 8, 40, P.teal); c.hline(a.x + 7, a.y + 12, 28, P.teal);
  bubble(a.x + 26, a.y + 24, 46, 10, P.sky, true);
  c.hline(a.x + 30, a.y + 28, 36, P.deep);
  bubble(a.x + 3, a.y + 40, 58, 22, '#c9f6f4', false);
  c.hline(a.x + 7, a.y + 44, 32, P.teal);
  // pizza dentro da bolha
  c.poly([[a.x + 8, a.y + 49], [a.x + 24, a.y + 49], [a.x + 16, a.y + 60]], P.sun);
  c.hline(a.x + 8, a.y + 48, 17, '#e0913a'); c.hline(a.x + 8, a.y + 49, 17, '#f2b25a');
  for (const [dx, dy] of [[12, 52], [18, 51], [16, 56]]) { c.rect(a.x + dx, a.y + dy, 2, 2, P.coral); }
  c.hline(a.x + 30, a.y + 50, 24, P.teal); c.hline(a.x + 30, a.y + 54, 18, P.teal); c.text('$12', a.x + 30, a.y + 57, P.coralDark);
  // input
  c.rect(a.x + 2, a.y + a.h - 9, a.w - 14, 7, '#eef6fc'); c.frame(a.x + 2, a.y + a.h - 9, a.w - 14, 7, P.gray);
  c.rect(a.x + a.w - 10, a.y + a.h - 9, 8, 7, P.aqua); c.poly([[a.x + a.w - 8, a.y + a.h - 7], [a.x + a.w - 8, a.y + a.h - 4], [a.x + a.w - 4, a.y + a.h - 6]], P.white);
  // gráfico de barras
  const g = aeroWindow(c, 94, 8, 58, 46, { address: false, bar: 6 });
  c.hline(g.x + 4, g.y + g.h - 4, g.w - 8, P.inkSoft); c.vline(g.x + 4, g.y + 3, g.h - 7, P.inkSoft);
  [12, 18, 15, 26, 22, 32].forEach((h, i) => {
    const x = g.x + 8 + i * 8, y = g.y + g.h - 4 - h, col = [P.coral, P.sun, P.leaf][i % 3];
    c.rect(x, y, 6, h, col); c.vline(x, y, h, '#ffffff@0.45'); c.vline(x + 5, y, h, '#0b2a4a@0.2');
  });
  // card comida: hambúrguer + pizza
  const f = aeroWindow(c, 94, 60, 58, 32, { address: false, bar: 6 });
  const bx = f.x + 6, by = f.y + 4;
  c.ellipse(bx + 10, by + 5, 10, 5, (x, y) => (y <= by + 6 ? '#f0a050' : undefined));
  c.set(bx + 6, by + 2, P.cream); c.set(bx + 10, by + 1, P.cream); c.set(bx + 13, by + 3, P.cream);
  c.rect(bx, by + 7, 21, 2, P.leaf); for (let x = 0; x < 21; x += 3) c.set(bx + x, by + 9, P.leaf);
  c.rect(bx + 1, by + 9, 19, 2, P.sun);
  c.rect(bx, by + 11, 21, 3, '#7a3f22');
  c.rrect(bx, by + 14, 21, 4, 1, '#e8913f');
  const px = f.x + 32;
  c.poly([[px, by], [px + 20, by], [px + 10, by + 19]], P.sun);
  c.rect(px, by - 1, 21, 3, '#e0913a'); c.hline(px, by - 1, 21, '#f2b25a');
  for (const [dx, dy] of [[5, 4], [12, 5], [9, 10], [8, 4]]) c.rect(px + dx, by + dy, 3, 2, P.coral);
  c.set(px + 14, by + 9, P.leaf); c.set(px + 6, by + 7, P.leaf);
  return finish('delivery-ia', c);
}

// ------------------------------------------------------------------ CAFETERIA
function cafeteria() {
  const c = new Canvas(W, H);
  for (let x = 0; x < W; x++) c.vline(x, 0, 74, Math.floor(x / 6) % 2 ? '#f3d9b1' : '#efcf9f');
  c.hline(0, 72, W, '#c99a66'); c.hline(0, 73, W, '#e3b98a');
  // lâmpada pendente
  c.vline(40, 0, 10, '#4a3020'); c.poly([[33, 16], [47, 16], [43, 10], [37, 10]], P.leafDark); c.hline(34, 15, 12, P.leaf);
  c.disc(40, 17, 2, '#fff3b0'); c.disc(40, 22, 10, '#fff3b0@0.18');
  // mesa
  c.rect(0, 74, W, 26, '#9a5e36');
  for (let y = 78; y < H; y += 6) c.hline(0, y, W, '#7b4526');
  c.hline(0, 74, W, '#c98b52');
  for (let i = 0; i < 6; i++) c.hline(10 + i * 27, 81 + (i % 3) * 6, 9, '#b0703f');
  // pires
  c.ellipse(42, 82, 26, 5, '#e8eef2'); c.ellipse(42, 81, 22, 3.5, '#ffffff'); c.ellipse(42, 83, 26, 5, (x, y) => (y >= 85 ? '#c7d3dc' : undefined));
  // xícara
  const cx = 42, top = 46, bot = 80;
  c.poly([[cx - 18, top], [cx + 18, top], [cx + 15, bot], [cx - 15, bot]], (x, y) => (x < cx - 10 ? '#fffdf8' : x > cx + 9 ? '#e3d8c6' : '#f7f1e6'));
  c.ellipse(cx, bot, 15, 2.5, '#e3d8c6');
  // alça
  c.ring(cx + 21, 60, 7, '#e3d8c6'); c.ring(cx + 21, 60, 6, '#f7f1e6');
  c.rect(cx + 16, 52, 3, 18, '#f7f1e6');
  c.ellipse(cx, top, 18, 4, '#d9cbb3');
  c.ellipse(cx, top + 0.5, 16, 3, '#6b3b1f');
  c.ellipse(cx, top + 0.5, 12, 2, '#a86a3e');
  // latte art coração
  for (const [dx, dy] of [[-2, -1], [-1, -1], [1, -1], [2, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) c.set(cx + dx, top + dy, '#f2dcc0');
  // faixa aqua na xícara
  c.poly([[cx - 17, 58], [cx + 17, 58], [cx + 17, 62], [cx - 17, 62]], P.aqua);
  c.hline(cx - 16, 58, 32, P.aquaLight);
  c.vline(cx - 14, 50, 26, '#ffffff');
  // vapor
  for (const [sx, ph] of [[34, 0], [42, 2], [50, 1]]) for (let y = 22; y < 42; y++) {
    const x = sx + Math.round(Math.sin((y + ph * 3) * 0.45) * 2);
    c.set(x, y, `#ffffff@${(0.25 + (y - 22) / 40).toFixed(2)}`);
  }
  // croissant
  c.ellipse(80, 76, 14, 3, '#e8eef2');
  c.ellipse(80, 72, 11, 5, (x, y) => (y <= 75 ? '#e8a04a' : undefined));
  for (const dx of [-6, -1, 4]) c.vline(80 + dx, 68, 7, '#c27a30');
  c.hline(73, 68, 12, '#f5c27a');
  // quadro de menu
  c.rect(96, 8, 56, 60, '#8a5a3c'); c.rect(98, 10, 52, 56, '#2f4a3a');
  c.hline(98, 10, 52, '#3d5e4a');
  c.text('MENU', 98 + (52 - textWidth('MENU', { scale: 2 })) / 2, 14, '#f4f1e6', { scale: 2 });
  const items = [['CAFE', '4'], ['LATTE', '7'], ['MOCHA', '8'], ['CHA', '5'], ['BOLO', '9']];
  items.forEach(([n, p], i) => {
    const y = 28 + i * 7;
    c.text(n, 102, y, i % 2 ? '#d8f3ff' : '#f4f1e6');
    for (let x = 102 + textWidth(n) + 2; x < 136; x += 2) c.set(x, y + 4, '#7a9a86');
    c.text(`$${p}`, 138, y, P.sun);
  });
  c.rect(110, 68, 2, 6, '#5a3a24'); c.rect(136, 68, 2, 6, '#5a3a24');
  return finish('cafeteria', c, { gloss: 0.16 });
}

// ------------------------------------------------------------------ DASHBOARD
function dashboard() {
  const c = new Canvas(W, H, '#eef6fc');
  // sidebar
  c.vbands(['#0b2a4a', '#103558', '#164066'], 0, H, { x0: 0, x1: 26 });
  c.rrect(6, 5, 14, 12, 2, P.aqua); c.text('R', 11, 8, P.white); c.hline(8, 6, 10, P.aquaLight);
  for (let i = 0; i < 5; i++) {
    const y = 24 + i * 12;
    if (i === 1) { c.rect(2, y - 2, 22, 11, '#1d4f7a'); c.vline(2, y - 2, 11, P.aqua); }
    c.frame(9, y, 8, 7, i === 1 ? P.aquaLight : '#5d88b0');
    c.rect(11, y + 2, 4, 3, i === 1 ? P.aqua : '#33557a');
  }
  // topo
  c.rect(26, 0, W - 26, 12, P.white); c.hline(26, 12, W - 26, '#cfe3f2');
  c.rect(32, 3, 50, 6, '#eef6fc'); c.frame(32, 3, 50, 6, '#cfe3f2'); c.ring(36, 6, 1.5, P.gray);
  c.disc(148, 6, 3.5, P.sky); c.disc(148, 5, 1.5, P.white); c.set(140, 4, P.coral); c.set(141, 4, P.coral);
  // cards KPI
  const kpis = [['1.2K', P.skyDeep, 'VISITAS'], ['87%', P.leafDark, 'META'], ['+24', P.coral, 'PEDIDOS']];
  kpis.forEach(([v, col, lbl], i) => {
    const x = 30 + i * 43, y = 16, w = 40, h = 22;
    c.rect(x, y, w, h, P.white); c.frame(x, y, w, h, '#cfe3f2'); c.vline(x, y, h, col); c.vline(x + 1, y, h, col);
    c.text(lbl, x + 5, y + 3, P.gray);
    c.text(v, x + 5, y + 10, col, { scale: 2 });
    // setinha de tendência
    c.poly([[x + w - 9, y + 8], [x + w - 3, y + 8], [x + w - 6, y + 4]], col);
  });
  // gráfico de linha
  const gx = 30, gy = 42, gw = 84, gh = 54;
  c.rect(gx, gy, gw, gh, P.white); c.frame(gx, gy, gw, gh, '#cfe3f2');
  c.text('RECEITA', gx + 4, gy + 3, P.inkSoft);
  for (let k = 0; k < 4; k++) c.hline(gx + 4, gy + 14 + k * 10, gw - 8, '#e3eef7');
  const pts = [44, 40, 42, 34, 36, 28, 30, 22, 25, 17, 20].map((v, k) => [gx + 5 + k * 7.4, gy + v]);
  for (let k = 0; k + 1 < pts.length; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
    for (let x = Math.ceil(x0); x <= x1; x++) { const y = Math.round(y0 + (y1 - y0) * (x - x0) / (x1 - x0)); c.vline(x, y, gy + gh - 5 - y, '#cdeefe'); }
  }
  const pts2 = [48, 47, 44, 45, 41, 40, 38, 39, 35, 34, 32].map((v, k) => [gx + 5 + k * 7.4, gy + v]);
  for (let k = 0; k + 1 < pts2.length; k++) c.line(...pts2[k], ...pts2[k + 1], P.leaf);
  for (let k = 0; k + 1 < pts.length; k++) c.line(...pts[k], ...pts[k + 1], P.skyDeep);
  for (const [x, y] of pts) { c.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, P.white); c.set(Math.round(x), Math.round(y), P.skyDeep); }
  // donut
  const dx = 118, dy = 42, dw = 38, dh = 54;
  c.rect(dx, dy, dw, dh, P.white); c.frame(dx, dy, dw, dh, '#cfe3f2');
  const ccx = dx + 18.5, ccy = dy + 20;
  const seg = [[0.4, P.aqua], [0.25, P.coral], [0.2, P.sun], [0.15, P.leaf]];
  c.disc(ccx, ccy, 13, (x, y) => {
    const d = Math.hypot(x - ccx, y - ccy); if (d < 7) return undefined;
    let a = (Math.atan2(y - ccy, x - ccx) / (2 * Math.PI) + 1.25) % 1, acc = 0;
    for (const [f, col] of seg) { acc += f; if (a < acc) return col; }
    return P.leaf;
  });
  seg.forEach(([f, col], i) => { c.rect(dx + 4, dy + 38 + i * 4, 3, 3, col); c.hline(dx + 9, dy + 39 + i * 4, 10 + f * 40, '#cfe3f2'); });
  return finish('dashboard', c, { gloss: 0.18 });
}

// ------------------------------------------------------------------ PIXEL SHOP
function pixelShop() {
  const c = new Canvas(W, H);
  c.vbands(['#c9f0ff', '#b4e6fb', '#a3dcf5'], 0, 88);
  for (let y = 88; y < H; y++) for (let x = 0; x < W; x++) c.set(x, y, (Math.floor(x / 6) + Math.floor(y / 6)) % 2 ? '#fff6d6' : '#f0d9a8');
  // toldo listrado
  for (let x = 0; x < W; x++) {
    const col = Math.floor(x / 10) % 2 ? P.white : P.aqua;
    c.vline(x, 0, 12, col);
    const sc = 12 + Math.round(Math.sin(((x % 10) / 10) * Math.PI) * 3);
    c.vline(x, 12, sc - 12, col);
    c.set(x, sc, P.teal);
  }
  c.hline(0, 0, W, P.teal); c.hline(0, 4, W, '#ffffff@0.4');
  // placa
  const label = 'PIXEL SHOP';
  const tw = textWidth(label, { scale: 2 });
  c.rrect(80 - tw / 2 - 6, 19, tw + 12, 14, 2, P.ink);
  c.rrect(80 - tw / 2 - 5, 20, tw + 10, 12, 2, P.coral); c.hline(80 - tw / 2 - 3, 21, tw + 6, '#ffb199');
  c.text(label, 80 - tw / 2, 22, P.white, { scale: 2 });
  // prateleiras
  const packs = [['slime', P.aqua], ['heart', P.pink], ['sword', P.skyDeep], ['potion', P.coral], ['tree', P.leaf], ['mush', P.sun], ['star', '#8f6bd8'], ['coin', P.teal]];
  [58, 86].forEach((sy, row) => {
    c.rect(6, sy, 148, 4, '#b97a4a'); c.hline(6, sy, 148, '#d9a06a'); c.hline(6, sy + 3, 148, '#7b4526');
    c.rect(10, sy + 4, 3, 2, '#7b4526'); c.rect(147, sy + 4, 3, 2, '#7b4526');
    for (let i = 0; i < 4; i++) {
      const [name, col] = packs[row * 4 + i];
      const bx = 14 + i * 36, bw = 26, bh = 22, by = sy - bh;
      c.rect(bx, by, bw, bh, col); c.frame(bx, by, bw, bh, P.ink);
      c.vline(bx + 1, by + 1, bh - 2, '#ffffff@0.45'); c.hline(bx + 1, by + 1, bw - 2, '#ffffff@0.45');
      c.rect(bx + 4, by + 3, 18, 14, P.white); c.frame(bx + 4, by + 3, 18, 14, '#0b2a4a@0.35');
      mini(c, name, bx + 9, by + 6);
      c.hline(bx + 6, by + 19, 14, '#ffffff@0.6');
      // etiqueta de preço
      c.rect(bx + bw - 3, sy - 6, 8, 5, P.cream); c.frame(bx + bw - 3, sy - 6, 8, 5, P.coralDark); c.set(bx + bw - 1, sy - 4, P.coral); c.set(bx + bw + 1, sy - 4, P.coral);
    }
  });
  return finish('pixel-shop', c);
}

// ------------------------------------------------------------------ GAME JAM
function jam() {
  const c = new Canvas(W, H);
  c.vbands(['#2a6fd6', '#2f8fe6', P.skyDeep, '#48b8ee', '#6fd0f5'], 0, H);
  const r = rng(9);
  for (let i = 0; i < 40; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H); const col = [P.sun, P.pink, P.leaf, P.aquaLight, P.coral][i % 5]; c.rect(x, y, 2, 1 + (i % 2), col); }
  const tw = textWidth('GAME JAM', { scale: 2 });
  c.text('GAME JAM', 80 - tw / 2 + 1, 7, P.ink, { scale: 2 });
  c.text('GAME JAM', 80 - tw / 2, 6, P.white, { scale: 2 });
  // relógio
  const cx = 46, cy = 56, R = 26;
  c.disc(cx + 2, cy + 3, R + 2, '#0b2a4a@0.25');
  c.disc(cx, cy, R + 2, P.ink);
  c.sphere(cx, cy, R + 1, R + 1, [P.teal, P.aqua, '#5fe0e6', P.aquaLight], { dither: false });
  c.disc(cx, cy, R - 3, P.ink);
  c.disc(cx, cy, R - 4, P.white);
  c.disc(cx, cy, R - 4, (x, y) => (y > cy + 6 ? '#eef6fc' : undefined));
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2, x = cx + Math.cos(a) * (R - 8), y = cy + Math.sin(a) * (R - 8);
    c.rect(Math.round(x) - (k % 3 === 0 ? 1 : 0), Math.round(y) - (k % 3 === 0 ? 1 : 0), k % 3 === 0 ? 2 : 1, k % 3 === 0 ? 2 : 1, k % 3 === 0 ? P.ink : P.inkSoft);
  }
  c.line(cx, cy, cx + 9, cy - 9, P.ink); c.line(cx + 1, cy, cx + 10, cy - 9, P.ink);
  c.line(cx, cy, cx - 2, cy - 15, P.ink);
  c.line(cx, cy, cx - 12, cy + 8, P.coral);
  c.disc(cx, cy, 1.5, P.coral);
  // brilho do vidro
  for (let k = 0; k < 8; k++) c.set(cx - 14 + k, cy - 15 - Math.floor(k / 3) + (k > 5 ? 1 : 0), '#ffffff@0.8');
  // sininhos
  c.disc(cx - 18, cy - 24, 4, P.coral); c.disc(cx + 18, cy - 24, 4, P.coral); c.set(cx - 19, cy - 26, '#ffb199'); c.set(cx + 17, cy - 26, '#ffb199');
  // controle
  const gx = 92, gy = 50;
  const G = new Canvas(W, H);
  G.rrect(gx, gy, 58, 20, 4, '#f4f8fb');
  G.disc(gx + 10, gy + 20, 9, '#f4f8fb'); G.disc(gx + 48, gy + 20, 9, '#f4f8fb');
  G.recolor((v, x, y) => (y > gy + 17 ? '#c9d6e2' : y < gy + 3 ? '#ffffff' : v));
  G.outline(P.ink);
  c.draw(G);
  c.rect(gx + 7, gy + 8, 9, 3, P.ink); c.rect(gx + 10, gy + 5, 3, 9, P.ink);
  for (const [dx, dy, col] of [[46, 6, P.coral], [51, 10, P.leaf], [41, 10, P.sun], [46, 14, P.skyDeep]]) { c.disc(gx + dx, gy + dy, 1.8, col); c.set(gx + dx - 1, gy + dy - 1, '#ffffff@0.7'); }
  c.rect(gx + 24, gy + 10, 4, 2, P.gray); c.rect(gx + 31, gy + 10, 4, 2, P.gray);
  c.text('48H', gx + 18, gy + 30, P.sun, { scale: 2 });
  // estrelinhas
  for (const [x, y] of [[90, 30], [146, 34], [20, 20], [140, 86]]) { c.set(x, y, P.white); c.set(x - 1, y, '#ffffff@0.6'); c.set(x + 1, y, '#ffffff@0.6'); c.set(x, y - 1, '#ffffff@0.6'); c.set(x, y + 1, '#ffffff@0.6'); }
  return finish('jam', c);
}

// ------------------------------------------------------------------ PROTÓTIPO (plataforma)
function prototype() {
  const c = new Canvas(W, H);
  c.vbands(['#5fc3f5', '#7fd3ff', '#a6e3fc', '#c9f0ff'], 0, H);
  // morros
  for (let x = 0; x < W; x++) { const h = 62 + Math.round(Math.sin(x * 0.05) * 6 + Math.sin(x * 0.13) * 2); c.vline(x, h, H - h, '#8fdcc0'); c.set(x, h, '#b8f0d8'); }
  // nuvens
  for (const [x, y, w] of [[20, 16, 18], [96, 10, 24], [132, 26, 14]]) { c.rect(x, y, w, 4, P.white); c.rect(x + 3, y - 3, w - 8, 3, P.white); c.hline(x, y + 4, w, '#d8f3ff'); }
  // tiles
  const tile = (tx, ty, n, top = true) => {
    for (let i = 0; i < n; i++) {
      const x = tx + i * 8;
      c.rect(x, ty, 8, 8, '#a8714a'); c.frame(x, ty, 8, 8, '#6b4430');
      c.set(x + 2, ty + 4, '#8a5a3c'); c.set(x + 5, ty + 6, '#c69466');
      if (top) { c.rect(x, ty, 8, 3, P.leaf); c.hline(x, ty, 8, P.leafLight); c.hline(x, ty + 3, 8, P.leafDark); c.set(x + 3, ty + 4, P.leafDark); }
    }
  };
  for (let x = 2; x < W - 2; x += 8) { tile(x, 84, 1); tile(x, 92, 1, false); }
  tile(28, 64, 4); tile(84, 48, 3); tile(124, 66, 3);
  // espinhos
  for (let i = 0; i < 4; i++) { const x = 64 + i * 5; c.poly([[x - 0.5, 84.5], [x + 4.5, 84.5], [x + 2, 78]], P.ink); c.poly([[x + 0.5, 84], [x + 3.5, 84], [x + 2, 80]], P.gray); c.vline(x + 2, 81, 3, P.white); }
  // moedas
  for (const [x, y] of [[28, 52], [52, 52], [90, 36], [100, 36], [132, 56]]) mini(c, 'coin', x, y);
  // bandeira
  c.vline(146, 50, 16, P.ink); c.poly([[147, 50], [155, 53], [147, 56]], P.coral);
  // personagem (genérico, redondinho)
  const px = 40, py = 50;
  const hero = ['..KKKK..', '.KaAAAK.', 'KaWKAWKK', 'KAAAAAAK', 'KAAOOAAK', '.KAAAAK.', '.KtKKtK.', '.KK..KK.'];
  hero.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') c.set(px + i, py + j + 6, { K: P.ink, a: P.aquaLight, A: P.aqua, W: P.white, O: P.pink, t: P.teal }[ch]); }));
  // caixas de colisão (debug)
  const dash = (x, y, w, h, col) => { for (let i = 0; i < w; i += 2) { c.set(x + i, y, col); c.set(x + i, y + h - 1, col); } for (let j = 0; j < h; j += 2) { c.set(x, y + j, col); c.set(x + w - 1, y + j, col); } };
  dash(px - 1, py + 5, 10, 10, '#ff3df0'); dash(28, 64, 32, 8, '#3dff7a'); dash(84, 48, 24, 8, '#3dff7a');
  // HUD
  c.rect(4, 4, 36, 9, '#0b2a4a@0.55'); c.text('FPS 60', 6, 6, P.leafLight);
  c.rect(120, 4, 36, 9, '#0b2a4a@0.55'); mini(c, 'coin', 122, 4); c.text('X03', 133, 6, P.white);
  return finish('prototype', c);
}

export default function () {
  return [verity(), ritmo(), instancer(), deliveryIa(), cafeteria(), dashboard(), pixelShop(), jam(), prototype()];
}
