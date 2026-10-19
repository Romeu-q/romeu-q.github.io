/* ==========================================================================
   ui.js — peças de interface reutilizáveis, sem regra de negócio:
     1. atalhos de DOM
     2. Movimento: animações WAAPI que respeitam prefers-reduced-motion + mola
     3. Dialogo: modal/gaveta acessíveis em cima do <dialog> nativo
     4. Toast: avisos curtos
     5. Confete: explosão de pixels no checkout
     6. Tilt: inclinação 3D + brilho que segue o mouse nos cards

   Por que Web Animations API (element.animate) e não uma biblioteca?
   Ela já vem no navegador, anima só transform/opacity (rodam na GPU, sem
   "jank") e devolve uma Promise (`.finished`) — dá para encadear "anima e
   depois remove" sem setTimeout chutando a duração.
   ========================================================================== */

/* ---------- 1. Atalhos ---------- */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

/** Cria elemento: criar('button', { class: 'x', texto: 'Oi', onclick }, ...filhos) */
function criar(tag, atributos = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(atributos)) {
    if (valor === false || valor == null) continue;
    if (chave === 'texto') el.textContent = valor;
    else if (chave === 'html') el.innerHTML = valor; // usado só com SVG gerado por nós (icone)
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor === true ? '' : valor);
  }
  el.append(...filhos.filter(Boolean));
  return el;
}

/** Troca todo [data-icone="nome"] pelo SVG do ícone em pixel art. */
function hidratarIcones(raiz = document) {
  $$('[data-icone]', raiz).forEach((el) => {
    el.outerHTML = icone(el.dataset.icone, 'icone ' + el.className);
  });
}

/* ---------- 2. Movimento ---------- */

const Movimento = (() => {
  const consulta = matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Gera uma curva de MOLA como easing `linear()` do CSS.
   * Simulamos a física (Hooke + amortecimento) quadro a quadro e entregamos
   * os pontos para o navegador interpolar. Resultado: o "balanço" natural de
   * uma mola sem nenhuma biblioteca e rodando no compositor.
   */
  function mola({ rigidez = 260, amortecimento = 24, massa = 1 } = {}) {
    const dt = 1 / 60;
    let x = 0;
    let v = 0;
    const pontos = [0];
    for (let t = 0; t < 2; t += dt) {
      const forca = -rigidez * (x - 1) - amortecimento * v;
      v += (forca / massa) * dt;
      x += v * dt;
      pontos.push(+x.toFixed(4));
      if (t > 0.2 && Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.01) break;
    }
    pontos[pontos.length - 1] = 1;
    const suporta = CSS.supports('animation-timing-function', 'linear(0, 1)');
    return {
      easing: suporta ? `linear(${pontos.join(', ')})` : 'cubic-bezier(.2, 1.15, .35, 1)',
      duracao: Math.round(pontos.length * dt * 1000),
    };
  }

  return {
    get reduzido() {
      return consulta.matches;
    },
    mola,
    /**
     * element.animate com freio: em movimento reduzido a animação dura 0ms
     * (o estado final é aplicado na hora, mas o código que espera
     * `.finished` continua funcionando igual).
     */
    animar(el, quadros, opcoes) {
      if (!el || !el.animate) return { finished: Promise.resolve(), cancel() {} };
      const o = typeof opcoes === 'number' ? { duration: opcoes } : { ...opcoes };
      if (consulta.matches) {
        o.duration = 0;
        o.delay = 0;
      }
      return el.animate(quadros, { easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'none', ...o });
    },
  };
})();

const EASE_SAIDA = 'cubic-bezier(.2, .8, .2, 1)';
const EASE_ENTRADA = 'cubic-bezier(.4, 0, 1, 1)';

/* ---------- 3. Diálogos acessíveis ----------
   O <dialog> com showModal() já entrega muita coisa de graça:
   - deixa o resto da página INERTE (sem foco, sem clique, oculto do leitor);
   - Esc dispara o evento `cancel`;
   - fica na "top layer", acima de qualquer z-index.
   Nós acrescentamos: animação de entrada/saída, foco preso no Tab
   (o nativo deixa o foco escapar para a barra do navegador), devolução do
   foco a quem abriu e trava de rolagem do fundo. */

const Dialogo = (() => {
  let atual = null; // { el, gatilho, aoFechar }
  const molaGaveta = Movimento.mola({ rigidez: 300, amortecimento: 28 });
  const telaPequena = matchMedia('(max-width: 639px)');

  const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

  function quadrosEntrada(el) {
    if (el.classList.contains('dialogo--gaveta')) {
      return { quadros: [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], duracao: molaGaveta.duracao, easing: molaGaveta.easing };
    }
    if (telaPequena.matches) {
      return { quadros: [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], duracao: molaGaveta.duracao, easing: molaGaveta.easing };
    }
    return {
      quadros: [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }],
      duracao: 280,
      easing: EASE_SAIDA,
    };
  }

  function abrir(el, { foco, aoFechar } = {}) {
    if (atual) fecharAgora();
    atual = { el, gatilho: document.activeElement, aoFechar };
    document.documentElement.classList.add('travado');
    el.showModal();
    // Toasts precisam morar dentro do diálogo aberto (ver index.html).
    el.append($('#toasts'));

    const { quadros, duracao, easing } = quadrosEntrada(el);
    Movimento.animar($('.veu', el), [{ opacity: 0 }, { opacity: 1 }], 220);
    Movimento.animar($('.painel', el), quadros, { duration: duracao, easing });
    (foco || $('.painel', el)).focus({ preventScroll: true });
  }

  function fecharAgora() {
    if (!atual) return null;
    const { el, gatilho, aoFechar } = atual;
    atual = null;
    el.close();
    document.body.append($('#toasts'));
    document.documentElement.classList.remove('travado');
    aoFechar && aoFechar();
    return gatilho;
  }

  async function fechar({ devolverFoco = true } = {}) {
    if (!atual || atual.fechando) return;
    atual.fechando = true;
    const el = atual.el;
    const gaveta = el.classList.contains('dialogo--gaveta');
    const saida = gaveta
      ? [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }]
      : telaPequena.matches
        ? [{ transform: 'none' }, { transform: 'translateY(100%)' }]
        : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.98)' }];
    Movimento.animar($('.veu', el), [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    await Movimento.animar($('.painel', el), saida, { duration: 200, easing: EASE_ENTRADA, fill: 'forwards' }).finished;
    // Remove o fill:'forwards' para a próxima abertura começar limpa.
    [$('.veu', el), $('.painel', el)].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    const gatilho = fecharAgora();
    // O botão que abriu pode ter sido recriado; se sumiu, cai no carrinho.
    if (devolverFoco) (gatilho && gatilho.isConnected ? gatilho : $('#btn-carrinho')).focus({ preventScroll: true });
  }

  // Esc: interceptamos o `cancel` nativo para animar a saída.
  document.addEventListener(
    'cancel',
    (e) => {
      if (atual && e.target === atual.el) {
        e.preventDefault();
        fechar();
      }
    },
    true
  );

  // Clique no véu ou em qualquer [data-fechar] fecha.
  document.addEventListener('click', (e) => {
    if (atual && e.target.closest('[data-fechar]') && atual.el.contains(e.target)) fechar();
  });

  // Foco preso: Tab no último volta ao primeiro (e Shift+Tab ao contrário).
  document.addEventListener('keydown', (e) => {
    if (!atual || e.key !== 'Tab') return;
    const focaveis = $$(FOCAVEIS, $('.painel', atual.el)).filter((n) => n.offsetParent !== null && !n.closest('[hidden]'));
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const ativo = document.activeElement;
    const dentro = focaveis.includes(ativo);
    if (e.shiftKey && (ativo === primeiro || !dentro)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && (ativo === ultimo || !dentro)) {
      e.preventDefault();
      primeiro.focus();
    }
  });

  return {
    abrir,
    fechar,
    get aberto() {
      return atual ? atual.el : null;
    },
  };
})();

/* ---------- 4. Toasts ---------- */

const Toast = (() => {
  const MAX = 3;

  function remover(t) {
    if (t.saindo) return;
    t.saindo = true;
    clearTimeout(t.timer);
    Movimento.animar(t, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.96)' }], { duration: 180, easing: EASE_ENTRADA, fill: 'forwards' })
      .finished.then(() => t.remove());
  }

  /** mostrar('texto', { tipo: 'ok' | 'info' | 'erro', acao: { rotulo, fn } }) */
  function mostrar(texto, { tipo = 'ok', acao } = {}) {
    const host = $('#toasts');
    const nomeIcone = tipo === 'erro' ? 'fechar' : tipo === 'info' ? 'copiar' : 'check';
    const t = criar('div', { class: `toast toast--${tipo}` }, criar('span', { class: 'toast__icone', html: icone(nomeIcone) }), criar('p', { texto }));
    if (acao) {
      t.append(
        criar('button', {
          type: 'button',
          class: 'toast__acao',
          texto: acao.rotulo,
          onclick: () => {
            remover(t);
            acao.fn();
          },
        })
      );
    }
    host.append(t);
    // Mantém no máximo 3 na tela: o mais antigo sai.
    const vivos = $$('.toast', host).filter((n) => !n.saindo);
    if (vivos.length > MAX) remover(vivos[0]);

    Movimento.animar(t, [{ opacity: 0, transform: 'translateY(12px) scale(.96)' }, { opacity: 1, transform: 'none' }], 240);
    const agendar = () => (t.timer = setTimeout(() => remover(t), acao ? 4500 : 3000));
    // Pausa enquanto o mouse/foco está nele: dá tempo de ler e clicar.
    t.addEventListener('pointerenter', () => clearTimeout(t.timer));
    t.addEventListener('pointerleave', agendar);
    t.addEventListener('focusin', () => clearTimeout(t.timer));
    agendar();
  }

  return { mostrar };
})();

/* ---------- 5. Confete de pixels ----------
   Um canvas temporário por cima de tudo, partículas quadradas (pixels!)
   com gravidade. Some sozinho em ~1,8s. Não roda com movimento reduzido. */

function confete(x, y, { quantidade = 90, cores = ['#f43f5e', '#a78bfa', '#fde68a', '#4ade80', '#7fd8ff', '#ffffff'] } = {}) {
  if (Movimento.reduzido) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = criar('canvas', { class: 'confete', 'aria-hidden': 'true' });
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  (Dialogo.aberto || document.body).append(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const particulas = Array.from({ length: quantidade }, () => {
    const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const forca = 380 + Math.random() * 520;
    return {
      x,
      y,
      vx: Math.cos(angulo) * forca,
      vy: Math.sin(angulo) * forca,
      tam: Math.random() < 0.3 ? 8 : 4,
      cor: cores[(Math.random() * cores.length) | 0],
      giro: Math.random() * 10,
    };
  });

  let anterior = performance.now();
  const inicio = anterior;
  function quadro(agora) {
    const dt = Math.min((agora - anterior) / 1000, 0.04);
    anterior = agora;
    const vida = (agora - inicio) / 1800;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particulas.forEach((p) => {
      p.vy += 1400 * dt; // gravidade
      p.vx *= 0.985; // resistência do ar
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.giro += dt * 12;
      // "Girar" um pixel = alternar a largura, como em sprites 8-bit.
      const largura = Math.abs(Math.sin(p.giro)) > 0.5 ? p.tam : p.tam / 2;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, vida - 0.6) / 0.4);
      ctx.fillStyle = p.cor;
      // Arredondar = bordas nítidas, sem anti-aliasing.
      ctx.fillRect(Math.round(p.x), Math.round(p.y), largura, p.tam);
    });
    if (vida < 1) requestAnimationFrame(quadro);
    else canvas.remove();
  }
  requestAnimationFrame(quadro);
}

/* ---------- 6. Tilt 3D + brilho ----------
   Só em dispositivos com mouse (hover: hover) e sem movimento reduzido.
   Medimos o card de FORA (que não gira) e aplicamos a rotação no de dentro,
   para a medição não "brigar" com a própria rotação. As variáveis CSS
   --rx/--ry/--mx/--my alimentam transform e o gradiente do brilho. */

const temMouse = matchMedia('(hover: hover) and (pointer: fine)');

function ativarTilt(externo, interno) {
  let raf = 0;
  externo.addEventListener('pointermove', (e) => {
    if (!temMouse.matches || Movimento.reduzido) return;
    const r = externo.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      interno.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg');
      interno.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
      interno.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      interno.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
  });
  externo.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf);
    interno.style.setProperty('--rx', '0deg');
    interno.style.setProperty('--ry', '0deg');
  });
}

/** Copia texto para a área de transferência (pode falhar sem HTTPS). */
async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (erro) {
    return false;
  }
}
