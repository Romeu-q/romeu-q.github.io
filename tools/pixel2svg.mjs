#!/usr/bin/env node
// pixel2svg — gera todos os SVGs pixel art do site.
//
//   node tools/pixel2svg.mjs                 gera tudo + valida
//   node tools/pixel2svg.mjs icon-mail logo  gera só esses sprites
//   node tools/pixel2svg.mjs --png out/      também salva PNGs de prévia (+ folhas de contato por pasta)
//   node tools/pixel2svg.mjs --rects         usa <rect> em vez de <path> (arquivos maiores)
//
// Fontes:
//   tools/sprites/*.txt   sprites desenhados em ASCII (formato explicado no topo de cada .txt)
//   tools/scenes/*.mjs    cenas procedurais (JS) que usam tools/lib/canvas.mjs
//
// Saída: retângulos de mesma cor são fundidos (runs horizontais + empilhamento vertical) e
// agrupados num <path> por cor; shape-rendering="crispEdges"; viewBox = tamanho do grid.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Canvas } from './lib/canvas.mjs';
import { CHARS } from './lib/palette.mjs';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOLS, '..');

// ---------------------------------------------------------------- parser .txt
function parseColor(spec, where) {
  const [hex, op] = spec.trim().split(/\s+/);
  if (hex === 'transparent' || hex === 'none') return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`${where}: cor inválida '${spec}'`);
  return op && Number(op) < 1 ? `${hex.toLowerCase()}@${Number(op)}` : hex.toLowerCase();
}

function parseOpts(tokens) {
  const o = {};
  for (const t of tokens) {
    const m = t.match(/^(\w+)=(.*)$/);
    if (m) o[m[1]] = m[2]; else o[t] = true;
  }
  return o;
}

function parseTxt(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const fileCtx = { dir: 'public/assets/img/pixel', scale: 1, palette: {} };
  const sprites = [];
  let cur = null; // sprite atual
  let block = null; // {kind, opts, rows:[], line}

  const flush = () => {
    if (!block) return;
    const b = block; block = null;
    const where = `${path.basename(file)}:${b.line}`;
    if (b.kind === 'palette') {
      const target = cur ? cur.palette : fileCtx.palette;
      for (const { text: r, line } of b.rows) {
        const m = r.match(/^(\S)\s+(.+)$/);
        if (!m) throw new Error(`${path.basename(file)}:${line}: linha de paleta inválida '${r}'`);
        target[m[1]] = parseColor(m[2], `${path.basename(file)}:${line}`);
      }
      return;
    }
    if (!cur) throw new Error(`${where}: bloco @${b.kind} fora de @sprite`);
    if (b.kind === 'style' || b.kind === 'motion') { cur[b.kind] += b.rows.map(r => r.raw).join('\n') + '\n'; return; }
    cur.blocks.push({ ...b, where });
  };

  lines.forEach((raw, i) => {
    const line = i + 1;
    const t = raw.trim();
    const isDirective = /^@(dir|scale|sprite|out|extends|drop|palette|grid|layer|patch|style|motion)\b/.test(t);
    if (block && (block.kind === 'style' || block.kind === 'motion') && !isDirective) {
      if (t && !t.startsWith('//')) block.rows.push({ text: t, raw, line });
      return;
    }
    if (!t || t.startsWith('//')) return;
    if (t.startsWith('@')) {
      flush();
      const [dir, ...rest] = t.slice(1).split(/\s+/);
      switch (dir) {
        case 'dir': (cur ? cur : fileCtx).dir = rest[0]; break;
        case 'scale': (cur ? cur : fileCtx).scale = Number(rest[0]); break;
        case 'sprite':
          cur = { name: rest[0], src: path.relative(ROOT, file).replace(/\\/g, '/'), dir: fileCtx.dir, scale: fileCtx.scale,
            palette: {}, filePalette: fileCtx.palette, blocks: [], style: '', motion: '', outs: null, extends: null, drops: [] };
          sprites.push(cur);
          break;
        case 'out': cur.outs = rest; break;
        case 'extends': cur.extends = rest[0]; break;
        case 'drop': cur.drops.push(...rest); break;
        case 'palette': case 'grid': case 'layer': case 'patch': case 'style': case 'motion':
          block = { kind: dir, opts: parseOpts(dir === 'layer' ? rest.slice(1) : rest), id: dir === 'layer' ? rest[0] : null, rows: [], line };
          break;
        default: throw new Error(`${path.basename(file)}:${line}: diretiva desconhecida @${dir}`);
      }
      return;
    }
    if (!block) throw new Error(`${path.basename(file)}:${line}: texto fora de bloco: '${t}'`);
    block.rows.push({ text: t, raw, line });
  });
  flush();
  return sprites;
}

function gridToCanvas(b, map) {
  let rows = b.rows.map(r => r.text);
  const w0 = rows[0].length;
  b.rows.forEach(r => {
    if (r.text.length !== w0) throw new Error(`${b.where.split(':')[0]}:${r.line}: linha com ${r.text.length} colunas, esperado ${w0}`);
  });
  if (b.opts.mirror) rows = rows.map(r => r + [...r].reverse().join(''));
  const c = new Canvas(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    if (ch === '_') { c.set(x, y, '_'); return; }
    if (!(ch in map)) throw new Error(`${b.where.split(':')[0]}:${b.rows[y].line}: char '${ch}' sem cor na paleta`);
    c.set(x, y, map[ch]);
  }));
  if (b.opts.outline) c.outline(map[b.opts.outline] || b.opts.outline, { diag: b.opts.diag === true || b.opts.diag === '1' });
  return c;
}

function buildTxtSprite(s, byName) {
  const map = { ...CHARS, ...s.filePalette, ...s.palette };
  let base = null; let layers = [];
  if (s.extends) {
    const parent = byName.get(s.extends);
    if (!parent) throw new Error(`${s.src}: @extends '${s.extends}' não encontrado`);
    const pb = resolve(parent, byName);
    base = pb.layers[0].canvas.clone();
    layers = pb.layers.slice(1).filter(l => !s.drops.includes(l.id)).map(l => ({ ...l, canvas: l.canvas.clone() }));
  }
  for (const b of s.blocks) {
    const c = gridToCanvas(b, map);
    const x = Number(b.opts.x || 0), y = Number(b.opts.y || 0);
    if (b.kind === 'grid') { base = c; continue; }
    if (!base) throw new Error(`${b.where}: @${b.kind} antes de @grid`);
    if (b.kind === 'patch') {
      for (let j = 0; j < c.h; j++) for (let i = 0; i < c.w; i++) {
        const v = c.get(i, j);
        if (v === '_') base.set(x + i, y + j, null); else if (v) base.set(x + i, y + j, v);
      }
    } else if (b.kind === 'layer') {
      const full = new Canvas(base.w, base.h);
      full.draw(c, x, y);
      layers.push({ id: b.id, cls: b.opts.class || null, hidden: !!b.opts.hidden, canvas: full });
    }
  }
  if (!base) throw new Error(`${s.src}: sprite '${s.name}' sem @grid`);
  return {
    name: s.name, src: s.src, scale: s.scale, w: base.w, h: base.h,
    outs: s.outs || [`${s.dir}/${s.name}.svg`],
    layers: [{ id: null, canvas: base }, ...layers], style: s.style, motion: s.motion,
  };
}

const resolved = new Map();
function resolve(s, byName) {
  if (!resolved.has(s.name)) resolved.set(s.name, buildTxtSprite(s, byName));
  return resolved.get(s.name);
}

// ---------------------------------------------------------------- encoder
const shortHex = h => (/^#(.)\1(.)\2(.)\3$/.test(h) ? `#${h[1]}${h[3]}${h[5]}` : h);

function layerRects(cv) {
  const out = new Map(); // color -> rects
  let open = new Map();
  for (let y = 0; y < cv.h; y++) {
    const next = new Map();
    let x = 0;
    while (x < cv.w) {
      const c = cv.get(x, y);
      if (!c || c === '_') { x++; continue; }
      let e = x + 1;
      while (e < cv.w && cv.get(e, y) === c) e++;
      const key = `${x},${e - x},${c}`;
      let r = open.get(key);
      if (r) r.h++;
      else {
        r = { x, y, w: e - x, h: 1 };
        if (!out.has(c)) out.set(c, []);
        out.get(c).push(r);
      }
      next.set(key, r);
      x = e;
    }
    open = next;
  }
  return out;
}

function encode(sp, { rects = false } = {}) {
  const s = sp.scale || 1;
  let body = '';
  const paint = (cv) => {
    let o = '';
    for (const [c, list] of layerRects(cv)) {
      const [hex, op] = c.split('@');
      const fill = `fill="${shortHex(hex)}"${op ? ` fill-opacity="${op}"` : ''}`;
      if (rects) o += `<g ${fill}>${list.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`).join('')}</g>`;
      else o += `<path ${fill} d="${list.map(r => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join('')}"/>`;
    }
    return o;
  };
  for (const l of sp.layers) {
    const inner = paint(l.canvas);
    if (l.id || l.cls) body += `<g${l.id ? ` id="${l.id}"` : ''}${l.cls ? ` class="${l.cls}"` : ''}>${inner}</g>\n`;
    else body += inner + '\n';
  }
  let css = (sp.style || '').trim();
  if (sp.motion && sp.motion.trim()) css += `${css ? '\n' : ''}@media (prefers-reduced-motion: no-preference){\n${sp.motion.trim()}\n}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sp.w} ${sp.h}" width="${sp.w * s}" height="${sp.h * s}" shape-rendering="crispEdges">\n` +
    `<!-- ${sp.name}: gerado por tools/pixel2svg.mjs a partir de ${sp.src}. Edite a fonte, não este arquivo. -->\n` +
    (css ? `<style>\n${css}\n</style>\n` : '') + body + '</svg>\n';
}

// ---------------------------------------------------------------- validação XML simples
function checkXml(str) {
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|<[^>]*>|&(?![a-z]+;|#\d+;)/g;
  const stack = []; let m; let roots = 0;
  while ((m = re.exec(str))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[0] === '&') throw new Error('& solto');
    if (!m[2]) throw new Error(`tag malformada: ${m[0].slice(0, 40)}`);
    if (m[1]) { if (stack.pop() !== m[2]) throw new Error(`fechamento inesperado </${m[2]}>`); }
    else if (!m[4]) { if (!stack.length) roots++; stack.push(m[2]); }
    if (m[2] === 'style' && !m[1]) { const end = str.indexOf('</style>', re.lastIndex); re.lastIndex = end; }
  }
  if (stack.length) throw new Error(`tags não fechadas: ${stack.join(',')}`);
  if (roots !== 1) throw new Error(`esperado 1 elemento raiz, achei ${roots}`);
}

// ---------------------------------------------------------------- PNG (prévia)
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function pngFromRGBA(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function rasterize(sp, scale, bg = [200, 200, 210]) {
  const list = Array.isArray(sp) ? sp : [sp]; sp = list[0];
  const w = sp.w * scale, h = sp.h * scale, buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { const x = Math.floor((i % w) / scale), y = Math.floor(Math.floor(i / w) / scale); const ch = ((x >> 2) + (y >> 2)) & 1 ? 0 : 18; buf[i * 4] = bg[0] - ch; buf[i * 4 + 1] = bg[1] - ch; buf[i * 4 + 2] = bg[2] - ch; buf[i * 4 + 3] = 255; }
  for (const l of list.flatMap(s => s.layers)) {
    if (l.hidden) continue;
    for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
      const c = l.canvas.get(x, y); if (!c || c === '_') continue;
      const [hex, op] = c.split('@'); const a = op ? Number(op) : 1;
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      for (let j = 0; j < scale; j++) for (let i = 0; i < scale; i++) {
        const o = ((y * scale + j) * w + x * scale + i) * 4;
        buf[o] = buf[o] * (1 - a) + r * a; buf[o + 1] = buf[o + 1] * (1 - a) + g * a; buf[o + 2] = buf[o + 2] * (1 - a) + b * a;
      }
    }
  }
  return { w, h, buf };
}
function sheet(images, maxW = 1400, gap = 8) {
  let x = gap, y = gap, rowH = 0; const pos = [];
  for (const im of images) { if (x + im.w + gap > maxW) { x = gap; y += rowH + gap; rowH = 0; } pos.push([x, y]); x += im.w + gap; rowH = Math.max(rowH, im.h); }
  const W = maxW, H = y + rowH + gap, buf = Buffer.alloc(W * H * 4, 255);
  images.forEach((im, k) => { const [ox, oy] = pos[k]; for (let j = 0; j < im.h; j++) im.buf.copy(buf, ((oy + j) * W + ox) * 4, j * im.w * 4, (j + 1) * im.w * 4); });
  return pngFromRGBA(W, H, buf);
}

// ---------------------------------------------------------------- main
async function main() {
  const args = process.argv.slice(2);
  const opt = { rects: args.includes('--rects') };
  const pngIdx = args.indexOf('--png');
  const pngDir = pngIdx >= 0 ? path.resolve(args[pngIdx + 1]) : null;
  const filter = args.filter((a, i) => !a.startsWith('--') && !(pngIdx >= 0 && i === pngIdx + 1));

  const all = [];
  const spritesDir = path.join(TOOLS, 'sprites');
  const txt = fs.readdirSync(spritesDir).filter(f => f.endsWith('.txt')).sort().flatMap(f => parseTxt(path.join(spritesDir, f)));
  const byName = new Map(txt.map(s => [s.name, s]));
  for (const s of txt) all.push(resolve(s, byName));

  const scenesDir = path.join(TOOLS, 'scenes');
  for (const f of fs.readdirSync(scenesDir).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
    const mod = await import(pathToFileURL(path.join(scenesDir, f)).href);
    for (const sc of mod.default()) {
      const layers = sc.layers || [{ id: null, canvas: sc.canvas }];
      all.push({ src: `tools/scenes/${f}`, scale: 1, style: '', motion: '', ...sc, layers, w: layers[0].canvas.w, h: layers[0].canvas.h,
        outs: sc.outs || [sc.out] });
    }
  }

  const names = new Set();
  for (const sp of all) { if (names.has(sp.name)) throw new Error(`nome duplicado: ${sp.name}`); names.add(sp.name); }
  const todo = filter.length ? all.filter(s => filter.includes(s.name)) : all;

  const report = []; const previews = new Map(); let fail = 0;
  for (const sp of todo) {
    for (const l of sp.layers) if (l.canvas.w !== sp.w || l.canvas.h !== sp.h) throw new Error(`${sp.name}: camada ${l.id} com tamanho diferente`);
    const svg = encode(sp, opt);
    try { checkXml(svg); } catch (e) { fail++; console.error(`XML inválido em ${sp.name}: ${e.message}`); }
    for (const o of sp.outs) {
      const dst = path.join(ROOT, o);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.writeFileSync(dst, svg);
    }
    const kb = Buffer.byteLength(svg) / 1024;
    const limit = sp.w * sp.h <= 16 * 16 ? 4 : 40;
    report.push({ file: sp.outs.join(' + '), grid: `${sp.w}x${sp.h}`, kb: kb.toFixed(1), warn: kb > limit ? `> ${limit}KB` : '' });
    if (pngDir) {
      const sc = Math.max(1, Math.round((sp.w <= 16 ? 64 : sp.w <= 64 ? 256 : 640) / sp.w));
      const im = rasterize(sp, sc);
      fs.mkdirSync(pngDir, { recursive: true });
      fs.writeFileSync(path.join(pngDir, `${sp.name}.png`), pngFromRGBA(im.w, im.h, im.buf));
      const g = path.dirname(sp.outs[0]).split('/').pop();
      if (!previews.has(g)) previews.set(g, []);
      previews.get(g).push(im);
    }
  }
  if (pngDir) {
    const stacks = new Map();
    for (const sp of todo) if (sp.stack) { if (!stacks.has(sp.stack)) stacks.set(sp.stack, []); stacks.get(sp.stack).push(sp); }
    for (const [k, list] of stacks) { const im = rasterize(list, 6); fs.writeFileSync(path.join(pngDir, `_stack-${k}.png`), pngFromRGBA(im.w, im.h, im.buf)); }
  }
  if (pngDir) for (const [g, ims] of previews) fs.writeFileSync(path.join(pngDir, `_sheet-${g}.png`), sheet(ims));

  const pad = (s, n) => String(s).padEnd(n);
  for (const r of report) console.log(`${pad(r.file, 48)} ${pad(r.grid, 8)} ${pad(r.kb + 'KB', 8)} ${r.warn}`);
  console.log(`\n${report.length} sprites gerados${fail ? `, ${fail} com XML inválido` : ', XML ok'}.`);
  if (fail) process.exit(1);
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
