/* ==========================================================================
   sprites.js — pixel art desenhada a partir de grades ASCII + animação.

   Por que ASCII em vez de PNG?
   - Zero imagens para baixar: a loja inteira carrega só texto.
   - Dá para "ler" o desenho no código e trocar a paleta por produto.
   - Cada caractere é 1 pixel: '.' = transparente, '0'..'9' = índice na paleta.

   Como a animação funciona:
   - Cada sprite tem 2 a 4 QUADROS (frames). Alguns são desenhados à mão
     (slime, explosão); outros são DERIVADOS do quadro base com pequenas
     operações (deslocar, carimbar pixels, brilho diagonal). Isso é o que um
     pixel artist faz no Aseprite: copia o quadro e mexe só no que muda.
   - Os quadros são pré-renderizados UMA vez em canvases pequenos (16x16).
     Animar = só copiar o quadro certo com drawImage, que é baratíssimo.
   - Um único laço requestAnimationFrame cuida de TODOS os sprites da página,
     e só desenha os que estão visíveis (IntersectionObserver). Com
     prefers-reduced-motion ativo, nada anima: fica o quadro 0, parado.
   ========================================================================== */

/* ---------- 1. Ferramentas para montar quadros a partir da grade ---------- */

const Grade = {
  /** Copia a grade em uma matriz de caracteres editável. */
  matriz(grade) {
    return grade.map((linha) => linha.split(''));
  },
  texto(matriz) {
    return matriz.map((linha) => linha.join(''));
  },
  /** Move o desenho inteiro dx/dy pixels (o que "sai" da borda some). */
  deslocar(grade, dx, dy) {
    const h = grade.length;
    const w = grade[0].length;
    const nova = Array.from({ length: h }, () => Array(w).fill('.'));
    grade.forEach((linha, y) => {
      for (let x = 0; x < w; x++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) nova[ny][nx] = linha[x];
      }
    });
    return Grade.texto(nova);
  },
  /** Desloca só um intervalo de linhas (ex.: copa da árvore balançando). */
  deslocarLinhas(grade, de, ate, dx) {
    return grade.map((linha, y) => {
      if (y < de || y > ate) return linha;
      return dx > 0 ? '.'.repeat(dx) + linha.slice(0, -dx) : linha.slice(-dx) + '.'.repeat(-dx);
    });
  },
  /** "Respiração": tudo acima da linha `ate` desce 1px; pés ficam no chão. */
  respirar(grade, ate) {
    return grade.map((linha, y) => {
      if (y === 0) return '.'.repeat(linha.length);
      if (y <= ate) return grade[y - 1];
      return linha;
    });
  },
  /** Carimba uma mini-grade em (x, y). '.' na mini-grade preserva o fundo. */
  carimbar(grade, mini, x0, y0) {
    const m = Grade.matriz(grade);
    mini.forEach((linha, y) => {
      for (let x = 0; x < linha.length; x++) {
        const c = linha[x];
        if (c !== '.' && m[y0 + y] && m[y0 + y][x0 + x] !== undefined) m[y0 + y][x0 + x] = c;
      }
    });
    return Grade.texto(m);
  },
  /** Troca pixels pontuais: [[x, y, 'c'], ...]. */
  pixels(grade, lista) {
    const m = Grade.matriz(grade);
    lista.forEach(([x, y, c]) => {
      if (m[y] && m[y][x] !== undefined) m[y][x] = c;
    });
    return Grade.texto(m);
  },
  /** Faixa de brilho diagonal (x + y === k ou k+1): troca `de` por `para`. */
  brilho(grade, de, para, k) {
    return grade.map((linha, y) =>
      linha
        .split('')
        .map((c, x) => (c === de && (x + y === k || x + y === k + 1) ? para : c))
        .join('')
    );
  },
  /** Sombra projetada 1px para baixo/direita, como em fontes bitmap. */
  sombra(grade, cor) {
    const m = Grade.matriz(grade);
    grade.forEach((linha, y) => {
      for (let x = 0; x < linha.length; x++) {
        if (linha[x] === '.' || linha[x] === cor) continue;
        if (m[y + 1] && m[y + 1][x + 1] === '.') m[y + 1][x + 1] = cor;
      }
    });
    return Grade.texto(m);
  },
};

/* ---------- 2. Os desenhos ---------- */

const BASE = {
  arvore: [
    '......0000......',
    '....00333200....',
    '...0333222210...',
    '..033222222110..',
    '..032226222110..',
    '.03222222221110.',
    '.02222222222110.',
    '.02262222221110.',
    '.01222222211110.',
    '..011222111110..',
    '...0011111100...',
    '.....004500.....',
    '......0450......',
    '......0450......',
    '.....004550.....',
    '....00000000....',
  ],
  tijolos: [
    '0000000000000000',
    '2211111022111110',
    '1111111011111110',
    '1111111011111110',
    '0000000000000000',
    '1110221111102211',
    '1110111111101111',
    '1110111111101111',
    '0000000000000000',
    '2211111022111110',
    '1111111011111110',
    '1111111011111110',
    '0000000000000000',
    '1110221111102211',
    '1110111111101111',
    '1110111111101111',
  ],
  cavaleiro: [
    '......7777......',
    '.....077770.....',
    '....00222200....',
    '...0233222210...',
    '...0232222210.9.',
    '...0000000000.9.',
    '...0221221210.9.',
    '....02222110..9.',
    '...055444455088.',
    '..02544844520.6.',
    '..02544444520.6.',
    '..0.0555555000..',
    '....05555550....',
    '....0550.550....',
    '....0660.660....',
    '...00000.00000..',
  ],
  painel: [
    '................',
    '.00000000000000.',
    '.01111111111110.',
    '.01333333333320.',
    '.01344434443320.',
    '.01333333333320.',
    '.01344443433320.',
    '.01333333333320.',
    '.01344433333320.',
    '.01333333333320.',
    '.01333333666320.',
    '.01333333363320.',
    '.02222222222220.',
    '.00000000000000.',
    '................',
    '................',
  ],
  letra: Grade.sombra(
    [
      '................',
      '................',
      '.....111111.....',
      '....11111111....',
      '...1111..1111...',
      '...111....111...',
      '...111....111...',
      '...1111111111...',
      '...1111111111...',
      '...111....111...',
      '...111....111...',
      '...111....111...',
      '...333....333...',
      '................',
      '................',
      '................',
    ],
    '0'
  ),
  pocao: [
    '................',
    '......4444......',
    '......0440......',
    '......0110......',
    '......0110......',
    '.....001100.....',
    '....00111100....',
    '...0112222210...',
    '..012322222210..',
    '..013222222250..',
    '..012222222250..',
    '..012222222550..',
    '..002222225500..',
    '...0022555500...',
    '.....000000.....',
    '................',
  ],
  gema: Grade.deslocar(
    [
      '................',
      '................',
      '....00000000....',
      '...0233222110...',
      '..023322221110..',
      '.02222221111110.',
      '..012222211140..',
      '...0122211140...',
      '....01221140....',
      '.....012140.....',
      '......0140......',
      '.......00.......',
      '................',
      '................',
      '................',
      '................',
    ],
    0,
    2
  ),
  casa: [
    '................',
    '................',
    '................',
    '................',
    '.......00.000...',
    '......0110050...',
    '.....011110500..',
    '....01111110....',
    '...0111111110...',
    '..011111111110..',
    '.01222222222210.',
    '..033333333370..',
    '..034435534470..',
    '..034435534470..',
    '..033335533370..',
    '.00000000000000.',
  ],
  espada: [
    '.......00.......',
    '......0110......',
    '......0120......',
    '......0120......',
    '......0120......',
    '......0120......',
    '......0120......',
    '......0120......',
    '......0120......',
    '...0000000000...',
    '...0334664330...',
    '...0000550000...',
    '......0550......',
    '......0550......',
    '......0330......',
    '.......00.......',
  ],
  nave: [
    '.......00.......',
    '......0110......',
    '.....013310.....',
    '.....013310.....',
    '.....011110.....',
    '....01111120....',
    '....01111120....',
    '...0411111240...',
    '..044111112440..',
    '.04441111124440.',
    '0447701111077440',
    '00770.0110.07700',
    '......0000......',
    '......5665......',
    '.......55.......',
    '................',
  ],
};

// Slime e explosão: quadros desenhados à mão (squash & stretch não dá para
// derivar com um simples deslocamento — o formato muda).
const SLIME_A = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '......0000......',
  '....00122100....',
  '...0122111110...',
  '..012211111110..',
  '.01211111111110.',
  '.01110111101110.',
  '.01110111101110.',
  '.01111100111110.',
  '.04111111111140.',
  '..000000000000..',
];
const SLIME_B = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....000000.....',
  '...0012211100...',
  '..012211111110..',
  '.01211111111110.',
  '.01110111101110.',
  '0111101111011110',
  '0111111001111110',
  '0441111111111440',
  '.00000000000000.',
];

const EXPLOSAO = [
  [
    '................', '................', '................', '................',
    '................', '................', '.......33.......', '......3443......',
    '......3443......', '.......33.......', '................', '................',
    '................', '................', '................', '................',
  ],
  [
    '................', '................', '................', '................',
    '......2222......', '.....223322.....', '....22344322....', '....23444432....',
    '....23444432....', '....22344322....', '.....223322.....', '......2222......',
    '................', '................', '................', '................',
  ],
  [
    '................', '.......11.......', '..1...1221...1..', '...1.122221.1...',
    '....12233221....', '...1223333221...', '..122334433221..', '1122344444432211',
    '1122344444432211', '..122334433221..', '...1223333221...', '....12233221....',
    '...1.122221.1...', '..1...1221...1..', '.......11.......', '................',
  ],
  [
    '................', '................', '......5..5......', '...5..0110..5...',
    '.....011110.....', '...5011221105...', '...0122222210...', '.5.0123333210.5.',
    '...0122332210...', '...5011221105...', '.....011110.....', '...5..0110..5...',
    '......5..5......', '................', '................', '................',
  ],
];

const CHAMA = [
  ['..5..', '.565.', '.5765', '45765', '45664', '.454.'],
  ['.5...', '..56.', '.5675', '45675', '45664', '.454.'],
  ['...5.', '.56..', '5765.', '45765', '45664', '.454.'],
];
const SUPORTE = ['333', '080', '.8.', '.8.', '333', '.3.'];
const ESTRELA_P = ['.5.', '555', '.5.'];
const ESTRELA_G = ['..5..', '..5..', '55555', '..5..', '..5..'];

/* Moeda 8x8 (logo, herói e confete): giro em 3 quadros. */
const MOEDA = [
  ['..0000..', '.011110.', '01211110', '01211110', '01111130', '01111130', '.013330.', '..0000..'],
  ['...00...', '..0110..', '..0210..', '..0210..', '..0110..', '..0130..', '..0130..', '...00...'],
  ['...00...', '...03...', '...03...', '...03...', '...03...', '...03...', '...03...', '...00...'],
];

/* ---------- 3. Catálogo de sprites (quadros + velocidade) ---------- */

const SPRITES = {
  arvore: {
    fps: 3,
    quadros: [
      BASE.arvore,
      Grade.deslocarLinhas(BASE.arvore, 0, 4, 1),
      BASE.arvore,
      Grade.deslocarLinhas(BASE.arvore, 0, 4, -1),
    ],
  },
  tocha: {
    fps: 8,
    quadros: CHAMA.map((chama) => Grade.carimbar(Grade.carimbar(BASE.tijolos, chama, 5, 2), SUPORTE, 6, 8)),
  },
  cavaleiro: {
    fps: 3,
    quadros: [
      BASE.cavaleiro,
      Grade.respirar(BASE.cavaleiro, 12),
      // piscada: a fenda do elmo "acende" em azul por um quadro
      Grade.pixels(Grade.respirar(BASE.cavaleiro, 12), [[5, 6, '4'], [10, 6, '4']]),
      BASE.cavaleiro,
    ],
  },
  slime: {
    fps: 4,
    quadros: [SLIME_A, SLIME_B, SLIME_A, Grade.deslocar(SLIME_A, 0, -2)],
  },
  painel: {
    fps: 3,
    quadros: [
      Grade.pixels(BASE.painel, [[4, 8, '3'], [5, 8, '3'], [6, 8, '3'], [10, 10, '3'], [11, 10, '3'], [12, 10, '3'], [11, 11, '3']]),
      BASE.painel,
      Grade.pixels(BASE.painel, [[10, 10, '3'], [11, 10, '3'], [12, 10, '3'], [11, 11, '3']]),
      BASE.painel,
    ],
  },
  // Começa no quadro mais cheio: é o que aparece parado (movimento reduzido).
  explosao: { fps: 7, quadros: [EXPLOSAO[2], EXPLOSAO[3], EXPLOSAO[0], EXPLOSAO[1]] },
  letra: {
    fps: 6,
    quadros: [BASE.letra, Grade.brilho(BASE.letra, '1', '2', 8), Grade.brilho(BASE.letra, '1', '2', 13), Grade.brilho(BASE.letra, '1', '2', 18)],
  },
  pocao: {
    fps: 4,
    quadros: [
      Grade.pixels(BASE.pocao, [[6, 11, '6'], [9, 12, '6']]),
      Grade.pixels(BASE.pocao, [[6, 10, '6'], [9, 11, '6'], [8, 13, '6']]),
      Grade.pixels(BASE.pocao, [[7, 8, '6'], [9, 10, '6'], [6, 12, '6']]),
      Grade.pixels(BASE.pocao, [[7, 4, '6'], [8, 9, '6'], [7, 11, '6']]),
    ],
  },
  gema: {
    fps: 4,
    quadros: [
      BASE.gema,
      Grade.carimbar(Grade.deslocar(BASE.gema, 0, -1), ESTRELA_P, 11, 1),
      Grade.carimbar(Grade.deslocar(BASE.gema, 0, -1), ESTRELA_G, 10, 0),
      Grade.carimbar(BASE.gema, ESTRELA_P, 2, 9),
    ],
  },
  casa: {
    fps: 3,
    quadros: [
      Grade.pixels(BASE.casa, [[11, 3, '6'], [12, 1, '6'], [13, 1, '6']]),
      Grade.pixels(BASE.casa, [[11, 2, '6'], [12, 2, '6'], [13, 0, '6'], [4, 12, '8'], [5, 13, '8']]),
      Grade.pixels(BASE.casa, [[12, 3, '6'], [12, 1, '6'], [11, 0, '6'], [10, 12, '8'], [11, 13, '8']]),
    ],
  },
  espada: {
    fps: 6,
    quadros: [
      BASE.espada,
      Grade.brilho(BASE.espada, '1', '7', 8),
      Grade.brilho(Grade.brilho(BASE.espada, '1', '7', 11), '2', '7', 11),
      Grade.brilho(Grade.brilho(BASE.espada, '1', '7', 14), '2', '7', 14),
    ],
  },
  nave: {
    fps: 8,
    quadros: [
      BASE.nave,
      Grade.carimbar(BASE.nave, ['5665', '5665', '.55.'], 6, 13),
      Grade.carimbar(BASE.nave, ['6556', '.55.'], 6, 13),
    ],
  },
  moeda: { fps: 6, quadros: [MOEDA[0], MOEDA[1], MOEDA[2], MOEDA[1]] },
  // Estado vazio: o mesmo slime, triste (boca invertida e uma lágrima).
  slimeTriste: {
    fps: 2,
    quadros: [
      Grade.pixels(SLIME_A, [[7, 13, '1'], [8, 13, '1'], [6, 14, '0'], [9, 14, '0'], [4, 13, '6']]),
      Grade.pixels(SLIME_A, [[7, 13, '1'], [8, 13, '1'], [6, 14, '0'], [9, 14, '0'], [4, 14, '6']]),
    ],
  },
};

/* Paletas usadas fora dos produtos (logo, herói, estados vazios). */
const PALETAS_EXTRA = {
  moeda: ['#5c3d00', '#ffd23f', '#fff3b0', '#b8860b'],
  slimeTriste: ['#10301c', '#3ec46d', '#a6f5b8', '#ffffff', '#23894a', '#10301c', '#7fd8ff'],
};

/* ---------- 4. Pré-renderização ---------- */

const cacheQuadros = new Map();

/** Renderiza os quadros de um sprite com uma paleta (resultado em cache). */
function quadrosDoSprite(nome, paleta) {
  const chave = nome + '|' + paleta.join(',');
  if (cacheQuadros.has(chave)) return cacheQuadros.get(chave);

  const def = SPRITES[nome];
  const quadros = def.quadros.map((grade) => {
    const c = document.createElement('canvas');
    c.width = grade[0].length;
    c.height = grade.length;
    const ctx = c.getContext('2d');
    grade.forEach((linha, y) => {
      for (let x = 0; x < linha.length; x++) {
        const cor = paleta[Number(linha[x])];
        // '.' vira NaN -> undefined: transparente. Dígito sem cor também.
        if (!cor) continue;
        ctx.fillStyle = cor;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    return c;
  });
  cacheQuadros.set(chave, quadros);
  return quadros;
}

/* ---------- 5. Animador: um laço só para todos os sprites ---------- */

const Animador = (() => {
  const movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const ativos = new Map(); // canvas -> { quadros, fps, i, ultimo, visivel, pausado }
  let rafId = 0;

  const observador =
    'IntersectionObserver' in window
      ? new IntersectionObserver((entradas) => {
          entradas.forEach((e) => {
            const item = ativos.get(e.target);
            if (item) item.visivel = e.isIntersecting;
          });
        }, { rootMargin: '80px' })
      : null;

  function desenhar(canvas, item) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(item.quadros[item.i], 0, 0);
  }

  function laco(agora) {
    rafId = requestAnimationFrame(laco);
    ativos.forEach((item, canvas) => {
      if (!canvas.isConnected) {
        // canvas saiu da página (ex.: carrinho redesenhado): limpa a referência
        ativos.delete(canvas);
        observador && observador.unobserve(canvas);
        return;
      }
      if (!item.visivel || item.pausado) return;
      if (agora - item.ultimo < 1000 / item.fps) return;
      item.ultimo = agora;
      item.i = (item.i + 1) % item.quadros.length;
      desenhar(canvas, item);
    });
  }

  function iniciar() {
    if (!rafId && !movimentoReduzido.matches) rafId = requestAnimationFrame(laco);
  }
  function parar() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // Se a pessoa mudar a preferência com a página aberta, respeitamos na hora.
  movimentoReduzido.addEventListener('change', () => {
    if (movimentoReduzido.matches) {
      parar();
      ativos.forEach((item, canvas) => {
        item.i = 0;
        desenhar(canvas, item);
      });
    } else iniciar();
  });

  return {
    get reduzido() {
      return movimentoReduzido.matches;
    },
    /** Cria um <canvas> do sprite já registrado na animação. */
    criar(nome, paleta, classe = '') {
      const quadros = quadrosDoSprite(nome, paleta);
      const canvas = document.createElement('canvas');
      canvas.width = quadros[0].width;
      canvas.height = quadros[0].height;
      canvas.className = 'sprite ' + classe;
      canvas.setAttribute('aria-hidden', 'true'); // decorativo: o nome está em texto
      const item = { quadros, fps: SPRITES[nome].fps, i: 0, ultimo: 0, visivel: !observador, pausado: false };
      ativos.set(canvas, item);
      desenhar(canvas, item);
      observador && observador.observe(canvas);
      iniciar();
      return canvas;
    },
    pausar(canvas, pausado) {
      const item = ativos.get(canvas);
      if (item) item.pausado = pausado;
    },
    estado(canvas) {
      const item = ativos.get(canvas);
      return item ? { quadro: item.i, total: item.quadros.length, pausado: item.pausado } : null;
    },
  };
})();

/* ---------- 6. Ícones de interface em pixel art (SVG) ----------
   Mesmo princípio: grade ASCII -> um <path> com um quadradinho por pixel.
   Usa currentColor, então herda a cor do botão (inclusive no hover). */

const ICONES = {
  carrinho: ['..........', '00........', '.0.000000.', '.0.0....0.', '.00.....0.', '..0....0..', '..000000..', '..........', '..0...0...', '..........'],
  fechar: ['..........', '.0......0.', '..0....0..', '...0..0...', '....00....', '....00....', '...0..0...', '..0....0..', '.0......0.', '..........'],
  lixo: ['..........', '...0000...', '.00000000.', '..........', '..000000..', '..0.00.0..', '..0.00.0..', '..0.00.0..', '..000000..', '..........'],
  check: ['..........', '..........', '........0.', '.......00.', '.0....00..', '.00..00...', '..0000....', '...00.....', '..........', '..........'],
  busca: ['..........', '..0000....', '.0....0...', '.0....0...', '.0....0...', '..0000....', '......00..', '.......00.', '........0.', '..........'],
  grade: ['..........', '.00000000.', '.0..0..0..', '.00000000.', '.0..0..0..', '.00000000.', '.0..0..0..', '.00000000.', '..........', '..........'],
  play: ['..........', '..0.......', '..00......', '..000.....', '..0000....', '..0000....', '..000.....', '..00......', '..0.......', '..........'],
  pausa: ['..........', '..00..00..', '..00..00..', '..00..00..', '..00..00..', '..00..00..', '..00..00..', '..00..00..', '..00..00..', '..........'],
  seta: ['..........', '..........', '......0...', '.......0..', '.00000000.', '.......0..', '......0...', '..........', '..........', '..........'],
  voltar: ['..........', '..........', '...0......', '..0.......', '.00000000.', '..0.......', '...0......', '..........', '..........', '..........'],
  tag: ['..........', '.00000....', '.0....0...', '.0.00..0..', '.0.00...0.', '.0.......0', '..0.....0.', '...0...0..', '....0.0...', '.....0....'],
  raio: ['..........', '.....00...', '....00....', '...00.....', '..000000..', '.....00...', '....00....', '...00.....', '..0.......', '..........'],
  arquivo: ['..........', '..00000...', '..0...00..', '..0....0..', '..0.00.0..', '..0....0..', '..0.00.0..', '..0....0..', '..000000..', '..........'],
  escudo: ['..........', '.00000000.', '.0......0.', '.0..00..0.', '.0.0000.0.', '.0..00..0.', '..0....0..', '...0..0...', '....00....', '..........'],
  copiar: ['..........', '.00000....', '.0...0....', '.0.00000..', '.0.0...0..', '.000...0..', '...0...0..', '...00000..', '..........', '..........'],
};

/** Retorna o SVG (string) de um ícone. Decorativo por padrão. */
function icone(nome, classe = 'icone') {
  const grade = ICONES[nome];
  let d = '';
  grade.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) if (linha[x] === '0') d += `M${x} ${y}h1v1h-1z`;
  });
  return `<svg class="${classe}" viewBox="0 0 10 10" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="${d}"/></svg>`;
}
