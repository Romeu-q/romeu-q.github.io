/* ==========================================================================
   ui.js — peças de interface reaproveitáveis (sem regra de negócio)
   --------------------------------------------------------------------------
   Movimento, toasts, tema, menu lateral, controle segmentado e minigráficos.
   Cada função faz uma coisa e não sabe nada de "pedidos" ou "vendas": quem
   conecta isso aos dados é o app.js.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Movimento ----------
     Consulto a preferência na hora de animar (e não uma vez só no início),
     porque a pessoa pode mudar a configuração do sistema com a página aberta. */
  const consultaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const semMovimento = () => consultaMovimento.matches;

  const suavizar = (t) => 1 - Math.pow(1 - t, 4); // ease-out-quart: começa rápido, freia no fim

  // Interpola um número de "de" até "para" chamando aoAtualizar a cada frame.
  // requestAnimationFrame sincroniza com a tela (60/120 Hz) e pausa em aba oculta.
  function interpolar(de, para, duracao, aoAtualizar) {
    if (semMovimento() || de === para) { aoAtualizar(para); return () => {}; }
    let inicio = null;
    let id = 0;
    function passo(agora) {
      if (inicio === null) inicio = agora;
      const t = Math.min(1, (agora - inicio) / duracao);
      aoAtualizar(de + (para - de) * suavizar(t));
      if (t < 1) id = requestAnimationFrame(passo);
    }
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id); // permite cancelar se o período mudar no meio
  }

  // Contador animado: lembra o último valor de cada elemento (WeakMap), assim
  // ao trocar o período o número "anda" do valor antigo para o novo.
  const ultimos = new WeakMap();
  const cancelamentos = new WeakMap();
  function contar(elemento, valor, formatar, duracao = 800) {
    const de = ultimos.has(elemento) ? ultimos.get(elemento) : 0;
    ultimos.set(elemento, valor);
    if (cancelamentos.has(elemento)) cancelamentos.get(elemento)();
    cancelamentos.set(elemento, interpolar(de, valor, duracao, (v) => { elemento.textContent = formatar(v); }));
  }

  function debounce(fn, espera) {
    let id;
    return function (...args) {
      clearTimeout(id);
      id = setTimeout(() => fn.apply(this, args), espera);
    };
  }

  const esperar = (ms) => new Promise((ok) => setTimeout(ok, semMovimento() ? 0 : ms));

  // Cria elemento com atributos e filhos, evitando innerHTML com dados (XSS).
  function h(tag, atributos = {}, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(atributos)) {
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...filhos.flat().filter((f) => f != null && f !== false));
    return el;
  }

  // Ícone do sprite (#i-nome) — precisa do namespace SVG, por isso não usa h().
  const NS = 'http://www.w3.org/2000/svg';
  function icone(nome, classe = 'icone') {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', classe);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', `#i-${nome}`);
    svg.append(use);
    return svg;
  }

  /* ---------- Selo de variação (seta + texto, nunca só cor) ---------- */
  function preencherSelo(selo, variacao) {
    selo.className = 'selo';
    selo.replaceChildren();
    if (variacao === null || !Number.isFinite(variacao)) {
      selo.textContent = 'novo';
      return;
    }
    const arredondada = Math.round(variacao * 1000) / 1000;
    const tipo = arredondada > 0 ? 'alta' : arredondada < 0 ? 'baixa' : 'neutra';
    if (tipo !== 'neutra') selo.classList.add(`selo--${tipo}`);
    const leitor = { alta: 'alta de', baixa: 'queda de', neutra: 'estável,' }[tipo];
    selo.append(
      icone(tipo === 'alta' ? 'up' : tipo === 'baixa' ? 'down' : 'flat'),
      h('span', { class: 'so-leitor', text: `${leitor} ` }),
      Formato.percentual.format(arredondada).replace(/\s/g, ''),
    );
  }

  /* ---------- Minigráfico (sparkline) em SVG puro ----------
     Para 4 linhas pequeninas, uma instância de Chart.js cada seria exagero:
     um <path> calculado à mão é mais leve e anima com CSS. */
  let idGradiente = 0;
  function faisca(svg, serie) {
    // Em séries longas (30 dias) uso média móvel de 5 pontos: o minigráfico
    // mostra a TENDÊNCIA; o detalhe dia a dia fica no gráfico grande.
    const valores = serie.length > 14
      ? serie.map((_, i) => { const j = serie.slice(Math.max(0, i - 2), i + 3); return j.reduce((s, v) => s + v, 0) / j.length; })
      : serie;
    const w = 120, alt = 36, margem = 3;
    const max = Math.max(...valores), min = Math.min(...valores);
    const amplitude = max - min || 1;
    const pontos = valores.map((v, i) => [
      valores.length === 1 ? w / 2 : (i / (valores.length - 1)) * w,
      margem + (1 - (v - min) / amplitude) * (alt - margem * 2),
    ]);
    // Curva suave (Catmull-Rom → Bézier) em vez de "serrote" de retas.
    let d = `M${pontos[0][0].toFixed(1)},${pontos[0][1].toFixed(1)}`;
    for (let i = 0; i < pontos.length - 1; i++) {
      const p0 = pontos[i - 1] || pontos[i], p1 = pontos[i], p2 = pontos[i + 1], p3 = pontos[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const gid = `g-faisca-${++idGradiente}`;
    svg.innerHTML = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--acento)" stop-opacity=".28"/>
        <stop offset="1" stop-color="var(--acento)" stop-opacity="0"/></linearGradient></defs>
      <path class="area" fill="url(#${gid})" d="${d} L${w},${alt + 4} L0,${alt + 4} Z"/>
      <path class="linha" d="${d}"/>`;
    const linha = svg.querySelector('.linha');
    // Com vector-effect: non-scaling-stroke o comprimento real é o da tela.
    svg.style.setProperty('--comp', Math.ceil(linha.getTotalLength() * (svg.clientWidth / w || 1)) + 20);
    svg.classList.remove('desenhando');
    void svg.getBoundingClientRect(); // força reflow para a animação recomeçar
    svg.classList.add('desenhando');
  }

  /* ---------- Toasts ---------- */
  const caixaToasts = document.getElementById('toasts');
  function toast(titulo, texto, iconeNome = 'check') {
    const fechar = h('button', { type: 'button', class: 'botao-icone', 'aria-label': 'Fechar notificação' }, icone('x'));
    const el = h('div', { class: 'toast' },
      h('span', { class: 'toast__icone' }, icone(iconeNome)),
      h('p', { class: 'toast__texto' }, h('strong', { text: titulo }), h('span', { text: texto })),
      fechar);
    caixaToasts.append(el);
    let saiu = false;
    const sair = () => {
      if (saiu) return;
      saiu = true;
      el.classList.add('saindo');
      setTimeout(() => el.remove(), semMovimento() ? 0 : 200);
    };
    fechar.addEventListener('click', sair);
    // Pausa o tempo enquanto o mouse está em cima (dá tempo de ler).
    let id = setTimeout(sair, 4200);
    el.addEventListener('mouseenter', () => clearTimeout(id));
    el.addEventListener('mouseleave', () => { id = setTimeout(sair, 2000); });
    // Máximo de 3 na tela para não virar uma pilha.
    while (caixaToasts.children.length > 3) caixaToasts.firstElementChild.remove();
  }

  /* ---------- Download de arquivo gerado no navegador ---------- */
  function baixar(nome, conteudo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: nome, style: 'display:none' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); // libera a memória do Blob
  }

  /* ---------- Controle segmentado com pílula deslizante ---------- */
  function segmentado(grupo, aoMudar) {
    const pilula = grupo.querySelector('.segmentado__pilula');
    const botoes = [...grupo.querySelectorAll('button')];

    function posicionar() {
      const ativo = botoes.find((b) => b.getAttribute('aria-pressed') === 'true');
      if (!ativo) return;
      // offsetLeft/Width são relativos ao grupo: a pílula vai exatamente para baixo do botão.
      pilula.style.setProperty('--x', `${ativo.offsetLeft}px`);
      pilula.style.setProperty('--w', `${ativo.offsetWidth}px`);
    }
    function selecionar(botao, avisar = true) {
      botoes.forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
      posicionar();
      if (avisar) aoMudar(botao);
    }
    botoes.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') !== 'true') selecionar(b);
    }));
    // Setas esquerda/direita andam entre as opções (padrão de grupo de botões).
    grupo.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const i = botoes.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const prox = botoes[(i + (e.key === 'ArrowRight' ? 1 : -1) + botoes.length) % botoes.length];
      prox.focus();
      selecionar(prox);
    });
    // Sem transição no primeiro posicionamento (a pílula não "voa" do canto).
    pilula.style.transition = 'none';
    posicionar();
    requestAnimationFrame(() => requestAnimationFrame(() => { pilula.style.transition = ''; }));
    new ResizeObserver(posicionar).observe(grupo); // fonte carregou / layout mudou
    return { selecionar: (valor, avisar) => selecionar(botoes.find((b) => Object.values(b.dataset).includes(valor)), avisar) };
  }

  /* ---------- Tema ---------- */
  const CHAVE_TEMA = 'sabia-tema';
  const botaoTema = document.getElementById('botao-tema');
  const temaAtual = () => document.documentElement.getAttribute('data-theme');

  function aplicarTema(tema, salvar = true) {
    const raiz = document.documentElement;
    // A classe liga transições de cor só durante a troca (veja style.css).
    raiz.classList.add('trocando-tema');
    raiz.setAttribute('data-theme', tema);
    botaoTema.setAttribute('aria-pressed', String(tema === 'dark'));
    if (salvar) {
      try { localStorage.setItem(CHAVE_TEMA, tema); } catch (e) { /* sem storage: só não lembra */ }
    }
    setTimeout(() => raiz.classList.remove('trocando-tema'), 300);
    document.dispatchEvent(new CustomEvent('tema', { detail: tema }));
  }
  const alternarTema = () => aplicarTema(temaAtual() === 'dark' ? 'light' : 'dark');
  botaoTema.setAttribute('aria-pressed', String(temaAtual() === 'dark'));
  botaoTema.addEventListener('click', alternarTema);

  /* ---------- Menu lateral ---------- */
  const raiz = document.documentElement;
  const app = document.getElementById('app');
  const sidebar = document.getElementById('sidebar');
  const coluna = document.getElementById('coluna');
  const botaoMenu = document.getElementById('botao-menu');
  const botaoFechar = document.getElementById('botao-fechar-menu');
  const botaoRecolher = document.getElementById('botao-recolher');
  const veu = document.getElementById('veu');
  const desktop = window.matchMedia('(min-width: 1024px)');

  function abrirMenu() {
    app.classList.add('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'true');
    coluna.inert = true; // conteúdo atrás fica fora do Tab e do leitor de tela
    // Foco vai para dentro da gaveta só depois que ela fica visível.
    requestAnimationFrame(() => sidebar.querySelector('.nav__link[aria-current="true"]')?.focus());
  }
  function fecharMenu(devolverFoco = true) {
    if (!app.classList.contains('menu-aberto')) return;
    app.classList.remove('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    coluna.inert = false;
    if (devolverFoco) botaoMenu.focus();
  }
  botaoMenu.addEventListener('click', abrirMenu);
  botaoFechar.addEventListener('click', () => fecharMenu());
  veu.addEventListener('click', () => fecharMenu());
  sidebar.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });
  desktop.addEventListener('change', () => fecharMenu(false));

  function recolherMenu(recolher) {
    if (recolher) raiz.setAttribute('data-menu', 'recolhido');
    else raiz.removeAttribute('data-menu');
    botaoRecolher.setAttribute('aria-expanded', String(!recolher));
    botaoRecolher.setAttribute('aria-label', recolher ? 'Expandir menu' : 'Recolher menu');
    // Links só com ícone continuam com nome acessível (o <span> some só visualmente,
    // por opacidade) e ganham title para quem usa mouse.
    sidebar.querySelectorAll('.nav__link').forEach((a) => {
      if (recolher) a.title = a.textContent.trim(); else a.removeAttribute('title');
    });
    try { localStorage.setItem('sabia-menu', recolher ? 'recolhido' : 'expandido'); } catch (e) { /* ok */ }
  }
  botaoRecolher.addEventListener('click', () => recolherMenu(raiz.getAttribute('data-menu') !== 'recolhido'));
  recolherMenu(raiz.getAttribute('data-menu') === 'recolhido');

  // Indicador deslizante + "scrollspy": o item ativo acompanha a seção visível.
  const links = [...sidebar.querySelectorAll('.nav .nav__link')];
  const indicador = document.getElementById('nav-indicador');
  const trilhaAtual = document.getElementById('trilha-atual');
  let ativoAtual = null;

  function marcarAtivo(link) {
    if (!link) return;
    if (link !== ativoAtual) {
      links.forEach((l) => (l === link ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
      ativoAtual = link;
      const nome = link.querySelector('span').textContent;
      if (trilhaAtual.textContent !== nome) {
        trilhaAtual.textContent = nome;
        trilhaAtual.classList.remove('trocou');
        void trilhaAtual.offsetWidth;
        trilhaAtual.classList.add('trocou');
      }
    }
    indicador.style.setProperty('--y', `${link.parentElement.offsetTop}px`);
    indicador.style.height = `${link.offsetHeight}px`;
  }
  links.forEach((l) => l.addEventListener('click', () => {
    marcarAtivo(l);
    travarSpy();
    if (!desktop.matches) fecharMenu(false);
  }));

  // Durante a rolagem suave disparada por um clique, ignoro o spy para o
  // indicador não "passear" pelos itens do meio.
  let spyTravado = false, idTrava = 0;
  function travarSpy() { spyTravado = true; clearTimeout(idTrava); idTrava = setTimeout(() => { spyTravado = false; }, 900); }

  const secoes = links.map((l) => document.querySelector(l.getAttribute('href')));
  function atualizarSpy() {
    if (spyTravado) return;
    // Ativa a última seção cujo topo já passou de 35% da altura da tela.
    const linha = window.innerHeight * 0.35;
    let escolhido = links[0];
    secoes.forEach((s, i) => { if (s && s.getBoundingClientRect().top < linha) escolhido = links[i]; });
    // No fim da página, a última seção ganha (mesmo que seja baixa).
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) escolhido = links[links.length - 1];
    marcarAtivo(escolhido);
  }
  let agendado = false;
  window.addEventListener('scroll', () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; atualizarSpy(); });
  }, { passive: true });
  indicador.style.transition = 'none';
  marcarAtivo(links[0]);
  requestAnimationFrame(() => requestAnimationFrame(() => { indicador.style.transition = ''; }));
  new ResizeObserver(() => ativoAtual && marcarAtivo(ativoAtual)).observe(sidebar);

  // Ir para uma seção por código (paleta de comandos).
  function irPara(id) {
    const link = links.find((l) => l.getAttribute('href') === `#${id}`);
    const alvo = document.getElementById(id);
    if (!alvo) return;
    marcarAtivo(link);
    travarSpy();
    alvo.scrollIntoView({ behavior: semMovimento() ? 'auto' : 'smooth', block: 'start' });
    // Move o foco para a seção (leitor de tela continua dali), sem rolar de novo.
    if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
  }

  globalThis.UI = {
    semMovimento, consultaMovimento, interpolar, contar, debounce, esperar, h, icone,
    preencherSelo, faisca, toast, baixar, segmentado,
    temaAtual, aplicarTema, alternarTema, irPara, recolherMenu,
  };
})();
