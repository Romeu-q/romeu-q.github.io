/* ==========================================================================
   sprites.js — desenha pixel art a partir de "grades" ASCII.

   Ideia: cada sprite é uma lista de strings. Cada caractere é um pixel:
     '.'      = transparente
     '0'..'5' = índice na paleta do produto (ver data.js)
   O <canvas> tem o tamanho REAL do sprite (12x12 px) e o CSS o amplia com
   `image-rendering: pixelated`. Assim cada pixel do desenho vira um
   quadradão nítido, sem precisar de nenhuma imagem externa.
   ========================================================================== */

const SPRITES = {
  arvore: [
    '....0000....',
    '..00111100..',
    '.0111211110.',
    '.0112111110.',
    '011211111110',
    '011111111110',
    '.0111111110.',
    '..00111100..',
    '....0330....',
    '.....33.....',
    '.....33.....',
    '..44444444..',
  ],
  tijolo: [
    '000000000000',
    '012221012221',
    '011111011111',
    '011111011111',
    '000000000000',
    '122210122210',
    '111110111110',
    '111110111110',
    '000000000000',
    '012221012221',
    '011111011111',
    '011111011111',
  ],
  cavaleiro: [
    '....0000....',
    '...011110...',
    '..01121110..',
    '..03333330..',
    '..03033030..',
    '...033330...',
    '.0444444440.',
    '034444444430',
    '..04444440..',
    '..05500550..',
    '..05500550..',
    '.0000..0000.',
  ],
  slime: [
    '............',
    '....0000....',
    '..00111100..',
    '.0112111110.',
    '.0121111110.',
    '011211111110',
    '011311131110',
    '011411141110',
    '011111111110',
    '011111111110',
    '.0111111110.',
    '..00000000..',
  ],
  painel: [
    '000000000000',
    '011111111110',
    '012222222230',
    '012222222230',
    '012222222230',
    '012444455230',
    '012444455230',
    '012222222230',
    '012222222230',
    '013333333330',
    '000000000000',
    '............',
  ],
  explosao: [
    '............',
    '.....00.....',
    '.....00.....',
    '..0..00..0..',
    '...0.00.0...',
    '001122221100',
    '011223322110',
    '011223322110',
    '001122221100',
    '..0.0000.0..',
    '...0.00.0...',
    '.....00.....',
  ],
  letra: [
    '............',
    '....1111....',
    '...111111...',
    '..11....11..',
    '..11....11..',
    '..11....11..',
    '..11111111..',
    '..11111111..',
    '..11....11..',
    '..11....11..',
    '..22....22..',
    '............',
  ],
  pocao: [
    '....5555....',
    '....0110....',
    '....0110....',
    '...001100...',
    '..00222200..',
    '.0022222200.',
    '.0223222220.',
    '.0223222220.',
    '.0222222220.',
    '.0022222200.',
    '..00222200..',
    '....0000....',
  ],
  gema: [
    '............',
    '..00000000..',
    '.0113333110.',
    '011222222110',
    '012222222210',
    '001222222100',
    '.0122222210.',
    '..01222210..',
    '...012210...',
    '....0110....',
    '.....00.....',
    '............',
  ],
  casa: [
    '.....00.....',
    '....0110....',
    '...011110...',
    '..01111110..',
    '.0111111110.',
    '011111111110',
    '.2222222222.',
    '.2332223322.',
    '.2332224422.',
    '.2222224422.',
    '.2222224422.',
    '000000000000',
  ],
};

/**
 * Desenha um sprite num <canvas>.
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} grade   linhas de texto do sprite
 * @param {string[]} paleta  cores CSS, indexadas pelo dígito do caractere
 */
function desenharSprite(canvas, grade, paleta) {
  const altura = grade.length;
  const largura = grade[0].length;
  // Resolução interna = 1 pixel do canvas por pixel do desenho.
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, largura, altura);

  grade.forEach((linha, y) => {
    for (let x = 0; x < largura; x++) {
      const simbolo = linha[x];
      if (simbolo === '.' || simbolo === undefined) continue; // transparente
      const cor = paleta[Number(simbolo)];
      if (!cor) continue; // dígito sem cor na paleta: ignora em vez de quebrar
      ctx.fillStyle = cor;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

/** Cria um canvas já desenhado para um produto (atalho usado pela UI). */
function criarCanvasDoProduto(produto, classe) {
  const canvas = document.createElement('canvas');
  canvas.className = classe;
  // Decorativo: o nome do produto já está em texto ao lado.
  canvas.setAttribute('aria-hidden', 'true');
  desenharSprite(canvas, SPRITES[produto.sprite], produto.paleta);
  return canvas;
}
