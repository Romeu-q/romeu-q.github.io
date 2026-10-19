/* ==========================================================================
   hero.js — a cena animada do topo (parallax em pixel art).

   Como funciona:
   - O canvas tem resolução BAIXA (~190x112) e o CSS amplia por um fator
     INTEIRO (2x, 3x, 4x...). Fator inteiro = todo pixel do desenho vira um
     quadrado do mesmo tamanho. Com fator quebrado (3,4x) alguns pixels
     ficariam mais largos que outros — um pixel artist nota na hora.
   - Camadas com velocidades diferentes (céu parado, montanhas lentas, morros
     médios, chão rápido) criam a ilusão de profundidade: é o parallax dos
     jogos de plataforma dos anos 90.
   - O mouse desloca levemente as camadas (mais as do fundo que as da frente).
   - Pausa quando sai da tela (IntersectionObserver) e com movimento reduzido
     desenha um único quadro parado.
   ========================================================================== */

const Cena = (() => {
  const H = 112;
  const CHAO = 96; // linha do chão (y)
  let W = 190;
  let escala = 3;
  let canvas;
  let ctx;
  let visivel = true;
  let rafId = 0;
  let anterior = 0;
  let t = 0; // tempo "do mundo" em segundos
  let pontos = 0;
  const mouse = { x: 0, y: 0, alvoX: 0, alvoY: 0 };

  // Gerador pseudoaleatório com semente: as estrelas ficam sempre no mesmo
  // lugar a cada recarga (Math.random mudaria a cena toda vez).
  function aleatorio(semente) {
    let s = semente;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }

  const CORES_CEU = ['#0b0a1f', '#121033', '#1b1747', '#26205c', '#342870', '#4a2f7d'];
  let estrelas = [];
  let ceu;
  let camadaChao;
  let camadaMontanhas;
  let camadaMorros;
  let sprites;

  function produto(id) {
    return buscarProduto(id);
  }

  /** Desenha o céu em faixas com "dithering" (xadrez) na transição. */
  function desenharCeu(c) {
    const faixa = Math.ceil(78 / CORES_CEU.length);
    for (let y = 0; y < H; y++) {
      const i = Math.min(CORES_CEU.length - 1, Math.floor(y / faixa));
      const dentroDaFaixa = y % faixa;
      for (let x = 0; x < W; x++) {
        // Nas 2 últimas linhas de cada faixa, metade dos pixels já usa a próxima cor.
        const usarProxima = dentroDaFaixa >= faixa - 2 && (x + y) % 2 === 0 && i < CORES_CEU.length - 1;
        c.fillStyle = CORES_CEU[usarProxima ? i + 1 : i];
        c.fillRect(x, y, 1, 1);
      }
    }
  }

  /** Camada que se repete horizontalmente (largura = período das ondas). */
  function camadaRepetivel(largura, desenhar) {
    const c = document.createElement('canvas');
    c.width = largura;
    c.height = H;
    desenhar(c.getContext('2d'), largura);
    return c;
  }

  function preparar() {
    const rnd = aleatorio(7);
    estrelas = Array.from({ length: 46 }, () => ({
      x: rnd() * 400,
      y: rnd() * 62,
      fase: rnd() * 6.28,
      vel: 0.6 + rnd() * 2,
      grande: rnd() < 0.12,
    }));

    // Montanhas distantes: soma de senos com períodos que dividem 240,
    // então a camada emenda perfeitamente quando repete.
    camadaMontanhas = camadaRepetivel(240, (c, w) => {
      for (let x = 0; x < w; x++) {
        const a = (x / w) * Math.PI * 2;
        const topo = Math.round(58 + Math.sin(a * 2) * 9 + Math.sin(a * 5 + 1) * 4 + Math.sin(a * 11) * 1.5);
        c.fillStyle = '#2a1f5c';
        c.fillRect(x, topo, 1, H - topo);
        c.fillStyle = '#3d2c7a'; // borda iluminada pela lua
        c.fillRect(x, topo, 1, 1);
      }
    });

    // Morros com pinheiros em silhueta.
    camadaMorros = camadaRepetivel(160, (c, w) => {
      for (let x = 0; x < w; x++) {
        const a = (x / w) * Math.PI * 2;
        const topo = Math.round(80 + Math.sin(a * 3) * 4 + Math.sin(a * 7 + 2) * 2);
        c.fillStyle = '#17123a';
        c.fillRect(x, topo, 1, H - topo);
      }
      [12, 34, 41, 70, 96, 104, 131, 150].forEach((px, i) => {
        const alt = 9 + (i % 3) * 3;
        const base = 82;
        for (let y = 0; y < alt; y++) {
          const meia = Math.floor((y + 1) / 2.2);
          c.fillStyle = '#120e2e';
          c.fillRect(px - meia, base - alt + y, meia * 2 + 1, 1);
        }
      });
    });

    camadaChao = criarChao();

    const cav = produto('cavaleiro-pixel');
    const sli = produto('bestiario-slimes');
    const arv = produto('floresta-encantada');
    sprites = {
      cavaleiro: quadrosDoSprite('cavaleiro', cav.paleta),
      slime: quadrosDoSprite('slime', sli.paleta),
      arvore: quadrosDoSprite('arvore', arv.paleta),
      moeda: quadrosDoSprite('moeda', PALETAS_EXTRA.moeda),
    };
  }

  /** Desenha uma camada repetida com deslocamento (parallax). */
  function repetir(img, deslocamento, dy = 0) {
    const w = img.width;
    let x = -(((Math.round(deslocamento) % w) + w) % w);
    for (; x < W; x += w) ctx.drawImage(img, x, Math.round(dy));
  }

  /** Chão: um "tile" de 16px desenhado uma vez e repetido (como num tilemap). */
  function criarChao() {
    return camadaRepetivel(16, (c) => {
      for (let x = 0; x < 16; x++) {
        c.fillStyle = x % 5 === 0 ? '#a6f5b8' : '#3ec46d'; // tufos de grama
        c.fillRect(x, CHAO, 1, 1);
        c.fillStyle = '#2a8a4a';
        c.fillRect(x, CHAO + 1, 1, 2);
        for (let y = CHAO + 3; y < H; y++) {
          const my = y - CHAO;
          // terra em "tijolinhos" 16x8 com juntas escuras
          const junta = my % 8 === 0 || (x + (Math.floor(my / 8) % 2) * 8) % 16 === 0;
          c.fillStyle = junta ? '#3a2412' : (x + my) % 7 === 0 ? '#7a4a21' : '#5a3418';
          c.fillRect(x, y, 1, 1);
        }
      }
    });
  }

  function desenhar() {
    // mouse suavizado (lerp): o movimento chega "atrasado", parece mais físico
    mouse.x += (mouse.alvoX - mouse.x) * 0.08;
    mouse.y += (mouse.alvoY - mouse.y) * 0.08;
    const velocidade = 26; // px do mundo por segundo
    const mundo = t * velocidade;

    ctx.drawImage(ceu, 0, 0);

    // estrelas piscando
    estrelas.forEach((e) => {
      const x = Math.round(((e.x - mundo * 0.02 - mouse.x * 1) % W + W) % W);
      const brilho = Math.sin(t * e.vel + e.fase);
      if (brilho < -0.4) return;
      ctx.fillStyle = brilho > 0.6 ? '#ffffff' : '#9d8fd9';
      ctx.fillRect(x, Math.round(e.y), 1, 1);
      if (e.grande && brilho > 0.75) {
        ctx.fillStyle = '#c9bfff';
        ctx.fillRect(x - 1, Math.round(e.y), 1, 1);
        ctx.fillRect(x + 1, Math.round(e.y), 1, 1);
        ctx.fillRect(x, Math.round(e.y) - 1, 1, 1);
        ctx.fillRect(x, Math.round(e.y) + 1, 1, 1);
      }
    });

    // lua (círculo desenhado pixel a pixel) + halo
    const lx = Math.round(W - 38 - mouse.x * 1.5);
    const ly = Math.round(22 - mouse.y * 1);
    for (let y = -11; y <= 11; y++) {
      for (let x = -11; x <= 11; x++) {
        const d = x * x + y * y;
        if (d <= 49) {
          ctx.fillStyle = (x - 2) ** 2 + (y + 1) ** 2 <= 4 || (x + 3) ** 2 + (y - 3) ** 2 <= 2 ? '#e9c46a' : '#fde68a';
          ctx.fillRect(lx + x, ly + y, 1, 1);
        } else if (d <= 100 && (x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(253, 230, 138, .12)';
          ctx.fillRect(lx + x, ly + y, 1, 1);
        }
      }
    }

    repetir(camadaMontanhas, mundo * 0.15 + mouse.x * 3, mouse.y * 1.5);
    repetir(camadaMorros, mundo * 0.4 + mouse.x * 6, mouse.y * 2.5);

    // árvores do primeiro plano andam junto com o chão
    const quadroArvore = sprites.arvore[Math.floor(t * 3) % 4];
    [40, 150, 230].forEach((ax) => {
      const x = Math.round(((ax - mundo) % 260 + 260) % 260) - 20;
      ctx.drawImage(quadroArvore, x, CHAO - 16);
    });

    repetir(camadaChao, mundo);

    // moedas: uma a cada 70px do mundo; o cavaleiro pula para pegá-las
    const xCav = Math.round(W * 0.42);
    const espaco = 70;
    const alcance = mundo + xCav + 4; // ponto do mundo onde a moeda é "coletada"
    const quadroMoeda = sprites.moeda[Math.floor(t * 8) % 4];
    for (let mx = Math.ceil(alcance / espaco) * espaco; mx < mundo + W + espaco; mx += espaco) {
      ctx.drawImage(quadroMoeda, Math.round(mx - mundo), CHAO - 34 + Math.round(Math.sin(t * 4 + mx) * 1.5));
    }

    // pulo: parábola centrada na moeda mais próxima (topo do pulo = coleta)
    const maisProxima = Math.round(alcance / espaco) * espaco;
    const d = maisProxima - alcance;
    const pulo = Math.abs(d) < 13 ? Math.round(Math.cos((d / 13) * (Math.PI / 2)) * 18) : 0;

    const coletadas = Math.floor(alcance / espaco);
    if (desenhar.coletadas !== undefined && coletadas > desenhar.coletadas) {
      pontos += 100;
      const placar = document.getElementById('cena-pontos');
      if (placar) placar.textContent = String(pontos).padStart(6, '0');
    }
    desenhar.coletadas = coletadas;

    // sombra do cavaleiro diminui quando ele sobe
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    const sombra = Math.max(4, 10 - Math.round(pulo / 3));
    ctx.fillRect(xCav + 8 - sombra / 2, CHAO, sombra, 1);
    const quadroCav = sprites.cavaleiro[Math.floor(t * 8) % 2]; // correndo = respiração acelerada
    ctx.drawImage(quadroCav, xCav, CHAO - 16 - pulo);

    // slime perseguindo, pulando no próprio ritmo
    const fs = Math.floor(t * 6) % 4;
    ctx.drawImage(sprites.slime[fs], xCav - 34, CHAO - 16);
  }

  function laco(agora) {
    rafId = requestAnimationFrame(laco);
    if (!visivel) {
      anterior = agora;
      return;
    }
    // Trava a 30fps: é pixel art, mais quadros não aparecem e gastam bateria.
    if (agora - anterior < 1000 / 30) return;
    const dt = Math.min((agora - anterior) / 1000, 0.1);
    anterior = agora;
    t += dt;
    desenhar();
  }

  function ajustarTamanho() {
    const caixa = canvas.parentElement.getBoundingClientRect();
    // Fator inteiro que deixa a cena com ~170-200 px "lógicos" de largura.
    escala = Math.max(2, Math.min(5, Math.round(caixa.width / 180)));
    W = Math.ceil(caixa.width / escala);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W * escala + 'px';
    canvas.style.height = H * escala + 'px';
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // O céu não se move: desenhamos uma vez e só copiamos a cada quadro.
    ceu = document.createElement('canvas');
    ceu.width = W;
    ceu.height = H;
    desenharCeu(ceu.getContext('2d'));
    canvas.parentElement.style.setProperty('--altura-cena', H * escala + 'px');
    desenhar();
  }

  function iniciar() {
    canvas = document.getElementById('cena-canvas');
    if (!canvas) return;
    preparar();
    t = 4.2; // começa num quadro bonito (cavaleiro no meio do pulo)
    new ResizeObserver(ajustarTamanho).observe(canvas.parentElement);
    ajustarTamanho();

    if (Movimento.reduzido) return; // um quadro parado e pronto

    new IntersectionObserver(([e]) => (visivel = e.isIntersecting)).observe(canvas);
    const hero = canvas.closest('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.alvoX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.alvoY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    hero.addEventListener('pointerleave', () => {
      mouse.alvoX = 0;
      mouse.alvoY = 0;
    });
    rafId = requestAnimationFrame(laco);
  }

  return { iniciar };
})();
