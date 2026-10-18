// Peças reutilizáveis para as cenas (moldura Aero, janelas, folhas, mini-sprites).
import { Canvas } from './canvas.mjs';
import { P } from './palette.mjs';

// Camada de brilho "Aero" para miniaturas: reflexo curvo no topo + borda.
// Retorna um Canvas transparente para ser usado como camada por cima.
export function aeroGloss(w, h, { strength = 0.22 } = {}) {
  const g = new Canvas(w, h);
  const gh = Math.round(h * 0.36);
  g.ellipse(w / 2, -gh * 0.9, w * 0.78, gh * 1.9, (x, y) => (y >= 2 && y < gh && x >= 2 && x < w - 2 ? `#ffffff@${strength}` : undefined));
  g.hline(2, 2, w - 4, '#ffffff@0.55');
  return g;
}

// Moldura opaca: contorno ink 1px com cantos arredondados + filete claro interno.
export function aeroFrame(c, { inner = '#ffffff' } = {}) {
  const { w, h } = c;
  c.frame(0, 0, w, h, P.ink);
  c.frame(1, 1, w - 2, h - 2, inner);
  for (const [x, y] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) c.set(x, y, P.ink);
  return c;
}

// Janela estilo Aero (barra de título brilhante + 3 bolinhas + área de conteúdo).
// Retorna o retângulo do conteúdo {x,y,w,h}.
export function aeroWindow(c, x, y, w, h, { bar = 7, address = true, body = '#ffffff' } = {}) {
  c.rect(x, y, w, h, body);
  // barra de título em 2 tons + brilho
  c.rect(x, y, w, bar, P.skyDeep);
  c.rect(x, y, w, Math.ceil(bar / 2), P.sky);
  c.hline(x + 1, y + 1, w - 2, '#c9efff');
  const dots = [P.coral, P.sun, P.leaf];
  dots.forEach((d, i) => { const dx = x + 2 + i * 3; c.rect(dx, y + Math.floor(bar / 2) - 1, 2, 2, d); });
  if (address && w > 30) {
    c.rect(x + 12, y + 2, w - 15, bar - 4, '#ffffff');
    c.hline(x + 13, y + Math.floor(bar / 2), Math.min(10, w - 20), P.gray);
  }
  c.hline(x, y + bar, w, P.ink);
  c.frame(x - 1, y - 1, w + 2, h + 2, P.ink);
  // sombra suave
  c.hline(x, y + h + 1, w + 1, P.inkSoft);
  c.vline(x + w + 1, y, h + 2, P.inkSoft);
  return { x, y: y + bar + 1, w, h: h - bar - 1 };
}

// Folha alongada da base (bx,by) até a ponta (tx,ty); largura máx `wd`.
export function leafShape(c, bx, by, tx, ty, wd, { light = P.leaf, dark = '#4bb83e', rib = P.leafDark } = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const pts1 = [], pts2 = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const half = wd * Math.sin(Math.PI * Math.pow(t, 0.8)) * (1 - t * 0.15);
    const curve = Math.sin(t * Math.PI) * L * 0.08; // leve curvatura
    const px = bx + dx * t + nx * curve, py = by + dy * t + ny * curve;
    pts1.push([px + nx * half, py + ny * half]);
    pts2.push([px - nx * half, py - ny * half]);
  }
  c.poly([...pts1, ...pts2.reverse()], (x, y) => {
    const vx = x + 0.5 - bx, vy = y + 0.5 - by;
    const t = (vx * ux + vy * uy) / L;
    const curve = Math.sin(t * Math.PI) * L * 0.08;
    const side = vx * nx + vy * ny - curve;
    return side > 0 ? light : dark;
  });
  // nervura
  let px = bx, py = by;
  for (let i = 1; i <= N; i++) {
    const t = i / N * 0.85;
    const curve = Math.sin(t * Math.PI) * L * 0.08;
    const qx = bx + dx * t + nx * curve, qy = by + dy * t + ny * curve;
    c.line(px, py, qx, qy, rib);
    px = qx; py = qy;
  }
  return c;
}

// mini sprites 8x8 para prateleiras / ícones dentro de cenas
export const MINI_MAP = { K: P.ink, W: P.white, A: P.aqua, a: P.aquaLight, t: P.teal, G: P.leaf, g: P.leafDark, Y: P.sun, y: P.sunDark,
  O: P.coral, o: P.coralDark, P: P.pink, p: P.pinkDark, r: P.gray, R: P.grayDark, C: P.cream, B: P.skyDeep, S: P.sky, b: '#8a5a3c', n: '#c98b52' };
export const MINI = {
  slime: ['........', '..KKKK..', '.KaAAAK.', 'KaWAAAAK', 'KAKAAKAK', 'KAAAAAtK', 'KttttttK', '.KKKKKK.'],
  heart: ['........', '.KK.KK..', 'KOWKOOK.', 'KOOOOOK.', '.KOOoK..', '..KoK...', '...K....', '........'],
  sword: ['......KK', '.....KWK', '....KWrK', '.K.KWrK.', '.KKWrK..', '..KyK...', '.KbKK...', 'KKK.....'],
  potion: ['..KKK...', '..KnK...', '..KaK...', '.KaaaK..', 'KPWPPPK.', 'KPPPPpK.', '.KpppK..', '..KKK...'],
  tree: ['..KKKK..', '.KGGGGK.', 'KGlGGGgK', 'KGGGGggK', '.KGggggK', '..KKbKK.', '...KbK..', '..KKKKK.'],
  mush: ['..KKKK..', '.KOWOOK.', 'KOOOWOOK', 'KKKKKKKK', '..KCCK..', '..KCCK..', '..KKKK..', '........'],
  star: ['...K....', '..KYK...', 'KKKYKKK.', 'KYYWYYK.', '.KYYYK..', 'KYYKYYK.', 'KKK.KKK.', '........'],
  coin: ['..KKKK..', '.KYYYYK.', 'KYWyYYyK', 'KYWyYYyK', 'KYYyYYyK', 'KYYYYyyK', '.KyyyyK.', '..KKKK..'],
};
export const mini = (c, name, x, y, scale = 1) => {
  const rows = MINI[name];
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') c.rect(x + i * scale, y + j * scale, scale, scale, MINI_MAP[ch]); }));
};
