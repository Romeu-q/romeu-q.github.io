// Mini "canvas" de pixels para cenas procedurais (tools/scenes/*.mjs).
// Cada pixel guarda uma string de cor ('#rrggbb' ou '#rrggbb@0.5' p/ opacidade) ou null (transparente).
// Qualquer parâmetro de cor pode ser uma função (x, y, corAtual) => cor | undefined (undefined = não pinta).

export class Canvas {
  constructor(w, h, fill = null) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(fill);
  }

  static fromGrid(rows, map) {
    const c = new Canvas(rows[0].length, rows.length);
    c.stamp(rows, map, 0, 0);
    return c;
  }

  clone() {
    const c = new Canvas(this.w, this.h);
    c.px = this.px.slice();
    return c;
  }

  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.px[y * this.w + x] : null; }

  set(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (!this.inb(x, y)) return this;
    const cur = this.px[y * this.w + x];
    let v = typeof c === 'function' ? c(x, y, cur) : c;
    if (v === undefined) return this;
    // cor translúcida sobre pixel já pintado: mistura (alpha "over")
    if (v && cur && v.includes('@')) v = blend(cur, v);
    this.px[y * this.w + x] = v;
    return this;
  }

  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }
  hline(x, y, w, c) { return this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { return this.rect(x, y, 1, h, c); }

  // contorno de retângulo (1px)
  frame(x, y, w, h, c) {
    this.hline(x, y, w, c); this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c); this.vline(x + w - 1, y, h, c);
    return this;
  }

  // retângulo com cantos "arredondados" (corta r pixels em escada)
  rrect(x, y, w, h, r, c) {
    for (let j = 0; j < h; j++) {
      let inset = 0;
      if (j < r) inset = r - j;
      else if (j >= h - r) inset = j - (h - r) + 1;
      this.hline(x + inset, y + j, w - inset * 2, c);
    }
    return this;
  }

  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }
  disc(cx, cy, r, c) { return this.ellipse(cx, cy, r + 0.35, r + 0.35, c); }

  ring(cx, cy, r, c) {
    const tmp = new Canvas(this.w, this.h);
    tmp.disc(cx, cy, r, '#000');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!tmp.get(x, y)) continue;
      if (!tmp.get(x - 1, y) || !tmp.get(x + 1, y) || !tmp.get(x, y - 1) || !tmp.get(x, y + 1)) this.set(x, y, c);
    }
    return this;
  }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  // polígono preenchido (pontos [[x,y],...]), amostrado no centro do pixel
  poly(pts, c) {
    const ys = pts.map(p => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const sy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + (sy - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, c);
    }
    return this;
  }

  // curva quadrática "catenária" para fios: de (x0,y0) a (x1,y1) com flecha sag
  wire(x0, y0, x1, y1, sag, c) {
    let px = x0, py = y0;
    const n = Math.max(2, Math.abs(x1 - x0));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
      this.line(px, py, x, y, c);
      px = x; py = y;
    }
    return this;
  }

  // contorno automático: pixels vazios vizinhos (4 ou 8) de pixels pintados viram `c`
  outline(c, { diag = false, only = null } = {}) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      if (diag) nb.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      if (nb.some(([dx, dy]) => { const v = this.get(x + dx, y + dy); return v && v !== c && (!only || only(v)); })) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  }

  // cola outro canvas por cima (pixels não-nulos)
  draw(src, dx = 0, dy = 0) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const v = src.get(x, y);
      if (v) this.set(x + dx, y + dy, v);
    }
    return this;
  }

  // carimba um grid ASCII; map: char -> cor; '.' e ' ' = pula
  stamp(rows, map, x0 = 0, y0 = 0) {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        if (ch === '.' || ch === ' ') return;
        if (!(ch in map)) throw new Error(`stamp: char '${ch}' sem cor no mapa`);
        this.set(x0 + i, y0 + j, map[ch]);
      });
    });
    return this;
  }

  // troca cores
  recolor(fn) {
    for (let i = 0; i < this.px.length; i++) if (this.px[i]) this.px[i] = fn(this.px[i], i % this.w, Math.floor(i / this.w)) ?? this.px[i];
    return this;
  }

  // gradiente vertical em faixas com linha de dither entre faixas
  vbands(colors, y0, y1, { x0 = 0, x1 = this.w, dither = true } = {}) {
    const n = colors.length, h = y1 - y0;
    for (let y = y0; y < y1; y++) {
      const f = (y - y0) / h * n;
      const i = Math.min(n - 1, Math.floor(f));
      const rowInBand = Math.floor((f - i) * h / n + 1e-6);
      for (let x = x0; x < x1; x++) {
        let col = colors[i];
        if (dither && i > 0 && rowInBand === 0 && (x + y) % 2 === 0) col = colors[i - 1];
        this.set(x, y, col);
      }
    }
    return this;
  }

  // esfera sombreada: ramp do escuro ao claro; luz vinda de cima-esquerda
  sphere(cx, cy, rx, ry, ramp, { lx = -0.55, ly = -0.65, dither = true, mask = null } = {}) {
    const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly));
    this.ellipse(cx, cy, rx, ry, (x, y) => {
      if (mask && !mask(x, y)) return undefined;
      const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      let v = nx * lx + ny * ly + nz * lz; // -1..1
      v = (v + 0.25) / 1.25; // 0..1
      if (dither) v += (BAYER[y & 3][x & 3] - 7.5) / 16 / ramp.length;
      const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)));
      return ramp[idx];
    });
    return this;
  }

  text(str, x, y, c, { gap = 1, scale = 1 } = {}) {
    let cx = x;
    for (const ch of str.toUpperCase()) {
      const g = FONT[ch] || FONT['?'];
      g.forEach((row, j) => [...row].forEach((p, i) => { if (p === '#') this.rect(cx + i * scale, y + j * scale, scale, scale, c); }));
      cx += (g[0].length + gap) * scale;
    }
    return this;
  }
}

export const textWidth = (str, { gap = 1, scale = 1 } = {}) => ([...str.toUpperCase()].reduce((w, ch) => w + (FONT[ch] || FONT['?'])[0].length + gap, 0) - gap) * scale;

const parse = c => { const [h, a] = c.split('@'); return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a === undefined ? 1 : Number(a)]; };
const hex2 = n => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
// "src over dst" para cores no formato '#rrggbb@alpha'
export function blend(dst, src) {
  const [dr, dg, db, da] = parse(dst), [sr, sg, sb, sa] = parse(src);
  const a = sa + da * (1 - sa);
  if (a <= 0) return null;
  const mix = (s, d) => (s * sa + d * da * (1 - sa)) / a;
  const out = `#${hex2(mix(sr, dr))}${hex2(mix(sg, dg))}${hex2(mix(sb, db))}`;
  return a >= 0.995 ? out : `${out}@${Math.round(a * 100) / 100}`;
}

export const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// PRNG determinístico (mesma saída sempre)
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fonte 3x5
const F = s => s.split('|');
export const FONT = {
  '0': F('###|#.#|#.#|#.#|###'), '1': F('.#.|##.|.#.|.#.|###'), '2': F('##.|..#|.#.|#..|###'),
  '3': F('##.|..#|.#.|..#|##.'), '4': F('#.#|#.#|###|..#|..#'), '5': F('###|#..|##.|..#|##.'),
  '6': F('.##|#..|###|#.#|###'), '7': F('###|..#|.#.|.#.|.#.'), '8': F('###|#.#|###|#.#|###'),
  '9': F('###|#.#|###|..#|##.'),
  A: F('.#.|#.#|###|#.#|#.#'), B: F('##.|#.#|##.|#.#|##.'), C: F('.##|#..|#..|#..|.##'),
  D: F('##.|#.#|#.#|#.#|##.'), E: F('###|#..|##.|#..|###'), F: F('###|#..|##.|#..|#..'),
  G: F('.##|#..|#.#|#.#|.##'), H: F('#.#|#.#|###|#.#|#.#'), I: F('###|.#.|.#.|.#.|###'),
  J: F('..#|..#|..#|#.#|.#.'), K: F('#.#|#.#|##.|#.#|#.#'), L: F('#..|#..|#..|#..|###'),
  M: F('#.#|###|###|#.#|#.#'), N: F('##.|#.#|#.#|#.#|#.#'), O: F('.#.|#.#|#.#|#.#|.#.'),
  P: F('##.|#.#|##.|#..|#..'), Q: F('.#.|#.#|#.#|##.|.##'), R: F('##.|#.#|##.|#.#|#.#'),
  S: F('.##|#..|.#.|..#|##.'), T: F('###|.#.|.#.|.#.|.#.'), U: F('#.#|#.#|#.#|#.#|###'),
  V: F('#.#|#.#|#.#|#.#|.#.'), W: F('#.#|#.#|###|###|#.#'), X: F('#.#|#.#|.#.|#.#|#.#'),
  Y: F('#.#|#.#|.#.|.#.|.#.'), Z: F('###|..#|.#.|#..|###'),
  ' ': F('...|...|...|...|...'), '.': F('.|.|.|.|#'), ':': F('.|#|.|#|.'),
  '-': F('...|...|###|...|...'), '+': F('...|.#.|###|.#.|...'), '/': F('..#|..#|.#.|#..|#..'),
  '!': F('#|#|#|.|#'), '?': F('##.|..#|.#.|...|.#.'), '%': F('#.#|..#|.#.|#..|#.#'),
  '$': F('.##|##.|.#.|.##|##.'), '<': F('..#|.#.|#..|.#.|..#'), '>': F('#..|.#.|..#|.#.|#..'),
};
