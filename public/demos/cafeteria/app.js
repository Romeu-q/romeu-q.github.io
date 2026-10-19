// app.js — lógica do Café Sertão (JavaScript puro, sem dependências).
// Regra de ouro: evento do usuário -> muda o ESTADO -> chama render*() para redesenhar.
// O estado é a "fonte da verdade"; o HTML é só um reflexo dele.
// Animações: CSS transitions + Web Animations API (element.animate). Nada de biblioteca:
// menos peso, nenhum CDN que possa cair no dia em que o recrutador abrir a página.

const WHATSAPP_NUMBER = '5575900000000'; // número fictício da demo
const STORAGE_KEY = 'cafe-sertao:pedido:v2';
const FUSO = 'America/Bahia'; // o status "aberto agora" segue o relógio da loja, não o do visitante

// ---------- Utilitários ----------
const $ = (id) => document.getElementById(id);
const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }); // criado 1x e reaproveitado
const brl = (valor) => formatadorBRL.format(valor);

// matchMedia "vivo": se a pessoa mudar a preferência com a página aberta, respeitamos na hora.
const mqMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduzirMovimento = () => mqMovimento.matches;

// Remove acentos e põe em minúsculas: "pao" acha "Pão", "cafe" acha "Café".
// normalize('NFD') separa letra e acento; o regex apaga os acentos soltos.
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const icone = (nome, classe = 'ico') => `<svg class="${classe}" aria-hidden="true"><use href="#i-${nome}"/></svg>`;

// ---------- Estado ----------
const estado = {
  categoria: 'todos',
  busca: '',
  carrinho: {}, // { idDoProduto: quantidade } — guardar só o id evita duplicar dados do cardápio
};

const acharProduto = (id) => CARDAPIO.find((p) => p.id === id);

// ---------- Persistência (localStorage) ----------
// try/catch: localStorage pode falhar (aba anônima, cota cheia, bloqueio). O site segue funcionando sem salvar.
function salvarCarrinho() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado.carrinho)); } catch (e) { /* sem persistência */ }
}

function carregarCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Nunca confie no que vem do storage: mantemos só ids que existem e quantidades inteiras de 1 a 99.
    for (const [id, qtd] of Object.entries(salvo)) {
      if (acharProduto(id) && Number.isInteger(qtd) && qtd > 0 && qtd < 100) estado.carrinho[id] = qtd;
    }
  } catch (e) { estado.carrinho = {}; }
}

// =====================================================================
// CARDÁPIO
// =====================================================================

// Filtro = categoria E busca ao mesmo tempo. Retorna array novo (não altera CARDAPIO).
function produtosFiltrados() {
  const termo = normalizar(estado.busca.trim());
  return CARDAPIO.filter((p) => {
    const naCategoria = estado.categoria === 'todos' || p.cat === estado.categoria;
    const naBusca = !termo || normalizar(`${p.nome} ${p.desc} ${p.notas}`).includes(termo);
    return naCategoria && naBusca;
  });
}

// Chips são criados uma vez só; depois apenas trocamos aria-pressed.
// (Recriar os botões a cada clique faria o foco do teclado se perder.)
function renderChips() {
  $('chips').innerHTML = CATEGORIAS.map((c) => {
    const total = c.id === 'todos' ? CARDAPIO.length : CARDAPIO.filter((p) => p.cat === c.id).length;
    return `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === estado.categoria}">
      ${c.nome} <small aria-hidden="true">${total}</small></button>`;
  }).join('');
}

function atualizarChips() {
  $('chips').querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === estado.categoria)));
}

// Os textos vêm do nosso data.js (confiável), então montar com template string + innerHTML é seguro aqui.
function cardProduto(p, i, animar) {
  return `
    <li class="produto${animar ? ' produto--entra' : ''}" style="--i:${i}">
      <article class="produto__card">
        <div class="produto__foto">
          <img src="img/${p.img}.webp" alt="${p.alt}" width="720" height="900" loading="lazy" decoding="async">
        </div>
        <div class="produto__info">
          <p class="produto__notas">${p.notas}</p>
          <h3 class="produto__nome">${p.nome}</h3>
          <p class="produto__desc">${p.desc}</p>
          <div class="produto__rodape">
            <span class="produto__preco">${brl(p.preco)}</span>
            ${botaoAdicionar(p)}
          </div>
        </div>
      </article>
    </li>`;
}

function botaoAdicionar(p) {
  return `<button class="btn-add" type="button" data-add="${p.id}" aria-label="Adicionar ${p.nome} ao pedido">
    ${icone('plus')}<span>Adicionar</span></button>`;
}

function renderProdutos(animar = false) {
  const lista = produtosFiltrados();
  $('resultado').textContent = `${lista.length} ${lista.length === 1 ? 'item encontrado' : 'itens encontrados'}`;
  $('grade').innerHTML = lista.length
    ? lista.map((p, i) => cardProduto(p, i, animar && !reduzirMovimento())).join('')
    : '<li class="sem-resultado">Nada por aqui com esse filtro. Tente “café”, “gelado” ou “coalho”.</li>';
}

function renderAssinaturas() {
  const assinaturas = CARDAPIO.filter((p) => p.assinatura);
  $('assinaturas-lista').innerHTML = assinaturas.map((p, i) => `
    <li class="assinatura" data-reveal>
      <div class="assinatura__foto">
        <img src="img/${p.img}.webp" alt="${p.alt}" width="720" height="900" loading="lazy" decoding="async">
        <span class="assinatura__num" aria-hidden="true">0${i + 1}</span>
      </div>
      <p class="assinatura__notas">${p.notas}</p>
      <h3>${p.nome}</h3>
      <p class="assinatura__desc">${p.desc}</p>
      <div class="assinatura__rodape">
        <span class="preco">${brl(p.preco)}</span>
        ${botaoAdicionar(p)}
      </div>
    </li>`).join('');
}

// =====================================================================
// CARRINHO
// =====================================================================

function alterarQuantidade(id, delta) {
  const nova = (estado.carrinho[id] || 0) + delta;
  if (nova <= 0) delete estado.carrinho[id]; // chegou a zero: sai do carrinho
  else estado.carrinho[id] = Math.min(nova, 99);
  salvarCarrinho();
  renderCarrinho();
}

// Linhas { produto, qtd } — usadas pelo render E pela mensagem do WhatsApp (uma fonte só)
const itensDoCarrinho = () => Object.entries(estado.carrinho).map(([id, qtd]) => ({ produto: acharProduto(id), qtd }));
const calcularSubtotal = () => itensDoCarrinho().reduce((soma, { produto, qtd }) => soma + produto.preco * qtd, 0);
const totalDeItens = () => Object.values(estado.carrinho).reduce((a, b) => a + b, 0);

function renderCarrinho() {
  const itens = itensDoCarrinho();
  const total = totalDeItens();
  const subtotal = brl(calcularSubtotal());

  $('itens').innerHTML = itens.map(({ produto: p, qtd }) => `
    <li class="item" data-item="${p.id}">
      <img src="img/${p.img}.webp" alt="" width="64" height="80" loading="lazy">
      <span class="item__nome">${p.nome}</span>
      <span class="item__preco">${brl(p.preco * qtd)}</span>
      <div class="item__controles" role="group" aria-label="Quantidade de ${p.nome}">
        <button class="btn-icone" type="button" data-acao="menos" data-id="${p.id}" aria-label="Diminuir ${p.nome}">${icone('minus')}</button>
        <span class="qtd" aria-live="polite">${qtd}</span>
        <button class="btn-icone" type="button" data-acao="mais" data-id="${p.id}" aria-label="Aumentar ${p.nome}">${icone('plus')}</button>
        <button class="btn-icone item__remover" type="button" data-acao="remover" data-id="${p.id}" aria-label="Remover ${p.nome} do pedido">${icone('trash')}</button>
      </div>
    </li>`).join('');

  const vazio = itens.length === 0;
  $('vazio').hidden = !vazio;
  $('pedido').hidden = vazio; // sem itens, o formulário não faz sentido
  $('subtotal').textContent = subtotal;

  // Contador do header: número visual + texto completo só para leitor de tela
  $('contador').textContent = total;
  $('contador').dataset.zero = String(total === 0);
  $('contador-sr').textContent = `${total} ${total === 1 ? 'item' : 'itens'} no pedido`;

  // Barra fixa do celular
  $('barra-pedido').hidden = vazio;
  $('barra-qtd').textContent = total;
  $('barra-total').textContent = subtotal;
}

// ---------- Feedback ao adicionar ----------
function adicionar(id, botao) {
  const p = acharProduto(id);
  alterarQuantidade(id, 1);
  mostrarToast(`${p.nome} no pedido`);

  // Estado "Adicionado" no próprio botão por 1,2 s: confirmação no lugar onde o olho já está
  if (botao) {
    clearTimeout(botao._timer);
    botao.dataset.ok = 'true';
    botao.innerHTML = `${icone('check')}<span>Adicionado</span>`;
    botao._timer = setTimeout(() => {
      botao.dataset.ok = 'false';
      botao.innerHTML = `${icone('plus')}<span>Adicionar</span>`;
    }, 1200);
  }

  const foto = botao && botao.closest('.produto, .assinatura')?.querySelector('img');
  voarParaSacola(foto);
}

// Qual elemento representa o carrinho na tela agora? (barra no celular, botão no desktop)
function alvoDaSacola() {
  const barra = $('barra-pedido');
  if (!barra.hidden && getComputedStyle(barra).display !== 'none') return $('barra-qtd');
  return $('btn-sacola');
}

// "Fly to cart": uma miniatura da foto voa até o carrinho em arco.
// Usa só transform/opacity (rodam na GPU, sem recalcular layout) via Web Animations API.
function voarParaSacola(foto) {
  const alvo = alvoDaSacola();
  if (!foto || reduzirMovimento()) return pularContador(alvo);

  const de = foto.getBoundingClientRect();
  const para = alvo.getBoundingClientRect();
  const tam = 56;
  const x0 = de.left + de.width / 2 - tam / 2;
  const y0 = de.top + de.height / 2 - tam / 2;
  const x1 = para.left + para.width / 2 - tam / 2;
  const y1 = para.top + para.height / 2 - tam / 2;

  const voador = document.createElement('img');
  voador.src = foto.currentSrc || foto.src;
  voador.alt = '';
  voador.className = 'voador';
  document.body.appendChild(voador);

  const anim = voador.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0 },
    { transform: `translate(${x0}px, ${y0 - 20}px) scale(1.1)`, opacity: 1, offset: 0.15 },
    // ponto do meio mais alto que a reta = trajetória em arco
    { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(0.8)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px) scale(0.25)`, opacity: 0.4 },
  ], { duration: 720, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' });

  anim.onfinish = () => { voador.remove(); pularContador(alvo); };
}

function pularContador(alvo) {
  const el = alvo === $('btn-sacola') ? $('contador') : alvo;
  el.classList.remove('contador--pula');
  void el.offsetWidth; // força o navegador a "esquecer" a animação anterior para poder repetir
  el.classList.add('contador--pula');
}

let timerToast;
function mostrarToast(texto) {
  const t = $('toast');
  t.innerHTML = `${icone('check')}<span>${texto}</span>`;
  // dois frames: o primeiro tira o display:none (:empty), o segundo dispara a transição
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('toast--visivel')));
  clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    t.classList.remove('toast--visivel');
    setTimeout(() => { if (!t.classList.contains('toast--visivel')) t.textContent = ''; }, 400);
  }, 2600);
}

// =====================================================================
// GAVETA (dialog nativo + animação de mola)
// =====================================================================
let focoAnterior = null; // quem abriu a gaveta, para devolver o foco ao fechar

function abrirGaveta() {
  const gaveta = $('gaveta');
  if (gaveta.open) return;
  focoAnterior = document.activeElement;
  gaveta.showModal(); // foco preso dentro + resto da página inerte, nativamente
  // Espera um frame com o dialog já visível para a transição de entrada ter "de onde" partir
  requestAnimationFrame(() => gaveta.classList.add('gaveta--aberta'));
  $('btn-fechar').focus();
}

function fecharGaveta() {
  const gaveta = $('gaveta');
  if (!gaveta.open || gaveta.dataset.fechando) return;
  gaveta.dataset.fechando = '1';
  gaveta.classList.remove('gaveta--aberta');

  const concluir = () => {
    delete gaveta.dataset.fechando;
    gaveta.close();
    if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
  };
  if (reduzirMovimento()) return concluir();
  // Espera a animação de saída do painel; o timeout é um "plano B" caso o evento não dispare
  const painel = $('gaveta-painel');
  const fallback = setTimeout(concluir, 450);
  painel.addEventListener('transitionend', function fim(e) {
    if (e.target !== painel) return;
    painel.removeEventListener('transitionend', fim);
    clearTimeout(fallback);
    concluir();
  });
}

// =====================================================================
// PEDIDO NO WHATSAPP
// =====================================================================

// Texto do pedido com "\n" nas quebras; encodeURIComponent depois transforma acentos,
// espaços e quebras em algo seguro para ir dentro de uma URL.
function montarMensagem({ nome, entrega, endereco, obs }) {
  const linhas = itensDoCarrinho().map(({ produto: p, qtd }) => `• ${qtd}x ${p.nome} — ${brl(p.preco * qtd)}`);
  return [
    '*Novo pedido — Café Sertão*',
    '',
    ...linhas,
    '',
    `*Total: ${brl(calcularSubtotal())}*`,
    `Recebimento: ${entrega}`,
    endereco ? `Endereço: ${endereco}` : null,
    `Nome: ${nome}`,
    obs ? `Obs.: ${obs}` : null,
  ].filter((l) => l !== null).join('\n'); // filter remove as linhas opcionais vazias
}

function marcarErro(campoId, msg) {
  const campo = $(campoId);
  campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
  $(`erro-${campoId}`).textContent = msg;
}

function enviarPedido(e) {
  e.preventDefault(); // o formulário nunca recarrega a página
  const nome = $('nome').value.trim();
  const obs = $('obs').value.trim();
  const entrega = document.querySelector('input[name="entrega"]:checked').value;
  const ehEntrega = entrega === 'Entrega';
  const endereco = ehEntrega ? $('endereco').value.trim() : '';

  // Validação com mensagem ao lado do campo (aria-describedby liga o erro ao input)
  $('erro-geral').textContent = '';
  if (totalDeItens() === 0) { $('erro-geral').textContent = 'Adicione pelo menos um item ao pedido.'; return; }
  marcarErro('nome', nome ? '' : 'Informe seu nome para continuar.');
  marcarErro('endereco', ehEntrega && !endereco ? 'Informe o endereço para a entrega.' : '');
  if (!nome) return $('nome').focus();
  if (ehEntrega && !endereco) return $('endereco').focus();

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(montarMensagem({ nome, entrega, endereco, obs }))}`;
  // noopener: a nova aba não ganha acesso à nossa janela (window.opener) — boa prática de segurança
  window.open(url, '_blank', 'noopener');
}

// =====================================================================
// STATUS "ABERTO AGORA" + TABELA DE HORÁRIOS
// =====================================================================

// Dia da semana e hora atuais NO FUSO DA LOJA (Intl faz a conversão; não depende do relógio do visitante)
function agoraNaLoja() {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date())
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.weekday);
  return { dia, hora: Number(partes.hour) + Number(partes.minute) / 60 };
}

// 7 -> "7h", 7.5 -> "7h30"
const formatarHora = (h) => `${Math.floor(h)}h${h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : ''}`;

// Função pura (recebe dia/hora, devolve texto): fácil de testar com qualquer horário
function calcularStatus(dia, hora) {
  const hoje = HORARIOS[dia];
  if (hoje && hora >= hoje.abre && hora < hoje.fecha) {
    const quase = hoje.fecha - hora <= 1;
    return { aberto: true, texto: `${quase ? 'Fecha em breve' : 'Aberto agora'} · até ${formatarHora(hoje.fecha)}` };
  }
  if (hoje && hora < hoje.abre) return { aberto: false, texto: `Fechado · abre hoje às ${formatarHora(hoje.abre)}` };
  // Procura o próximo dia que abre (dá a volta na semana com o resto da divisão)
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    if (HORARIOS[d]) {
      const quando = i === 1 ? 'amanhã' : HORARIOS[d].dia.toLowerCase();
      return { aberto: false, texto: `Fechado · abre ${quando} às ${formatarHora(HORARIOS[d].abre)}` };
    }
  }
  return { aberto: false, texto: 'Fechado' };
}

function renderStatus() {
  const { dia, hora } = agoraNaLoja();
  const status = calcularStatus(dia, hora);
  document.querySelectorAll('[data-status]').forEach((el) => {
    el.dataset.aberto = String(status.aberto);
    el.querySelector('[data-status-texto]').textContent = status.texto;
  });
  // Tabela: destaca o dia de hoje
  $('horarios').innerHTML = HORARIOS.map((h, i) => ({ ...h, i }))
    .slice(1).concat({ ...HORARIOS[0], i: 0 }) // começa na segunda, termina no domingo (como no Brasil)
    .map((h) => `
      <tr class="${h.i === dia ? 'hoje' : ''}">
        <th scope="row">${h.dia}${h.i === dia ? ' <span class="selo-hoje">hoje</span>' : ''}</th>
        <td>${formatarHora(h.abre)} – ${formatarHora(h.fecha)}</td>
      </tr>`).join('');
}

// =====================================================================
// MOVIMENTO: hero, revelação ao rolar, parallax, header, letreiro
// =====================================================================

function iniciarHero() {
  document.querySelectorAll('[data-hero]').forEach((el, i) => el.style.setProperty('--i', i));
  // Dois frames garantem que o estado inicial foi pintado antes de trocar a classe (senão não anima)
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('pronto')));
}

// Elementos com data-reveal aparecem ao entrar na tela, em cascata (stagger) entre irmãos.
function iniciarRevelacao() {
  const alvos = document.querySelectorAll('[data-reveal]');
  if (reduzirMovimento() || !('IntersectionObserver' in window)) {
    alvos.forEach((el) => el.classList.add('visivel'));
    return;
  }
  // Índice entre irmãos revelados do mesmo pai = atraso da cascata
  alvos.forEach((el) => {
    const irmaos = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', Math.min(irmaos.indexOf(el), 5));
  });
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('visivel');
      obs.unobserve(en.target); // anima só uma vez: rolar para cima não "pisca" o conteúdo
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  alvos.forEach((el) => obs.observe(el));
}

// Parallax leve: a imagem anda mais devagar que a página.
// Escrevemos só transform, dentro de requestAnimationFrame (no máximo 1 cálculo por frame).
function iniciarParallax() {
  const imgs = [...document.querySelectorAll('[data-parallax]')];
  let agendado = false;

  function atualizar() {
    agendado = false;
    if (reduzirMovimento()) { imgs.forEach((img) => { img.style.transform = ''; }); return; }
    const vh = window.innerHeight;
    imgs.forEach((img) => {
      const caixa = img.parentElement.getBoundingClientRect();
      if (caixa.bottom < 0 || caixa.top > vh) return; // fora da tela: não gasta nada
      const fator = Number(img.dataset.parallax);
      const deslocamento = (caixa.top + caixa.height / 2 - vh / 2) * -fator;
      const limite = caixa.height * 0.075; // nunca passa da "sobra" de altura da imagem
      img.style.transform = `translate3d(0, ${Math.max(-limite, Math.min(limite, deslocamento)).toFixed(1)}px, 0)`;
    });
  }
  const agendar = () => { if (!agendado) { agendado = true; requestAnimationFrame(atualizar); } };
  window.addEventListener('scroll', agendar, { passive: true }); // passive: não bloqueia a rolagem
  window.addEventListener('resize', agendar);
  mqMovimento.addEventListener('change', agendar);
  atualizar();
}

// Header transparente no topo do hero; sólido assim que a pessoa começa a rolar
// (senão o texto do hero passaria "por baixo" de um header transparente e ficaria ilegível).
// Um "sentinela" invisível de 1px no topo da página: quando ele sai da tela, o header fica sólido.
// IntersectionObserver em vez de ouvir scroll: o navegador avisa só quando muda, sem cálculo a cada pixel.
function iniciarHeader() {
  const topo = $('topo');
  const sentinela = document.createElement('div');
  sentinela.setAttribute('aria-hidden', 'true');
  sentinela.style.cssText = 'position:absolute;top:64px;left:0;width:1px;height:1px;pointer-events:none';
  document.body.prepend(sentinela);
  new IntersectionObserver(([en]) => topo.classList.toggle('topo--solido', !en.isIntersecting)).observe(sentinela);
}

function iniciarLetreiro() {
  const trilho = $('letreiro');
  const lista = trilho.querySelector('.letreiro__lista');
  // Cópia idêntica lado a lado: ao andar -50%, a 2ª lista ocupa o lugar da 1ª e o loop fica sem emenda.
  const copia = lista.cloneNode(true);
  copia.setAttribute('aria-hidden', 'true'); // leitor de tela lê a lista uma vez só
  trilho.appendChild(copia);

  const botao = $('letreiro-pausa');
  botao.addEventListener('click', () => {
    const pausado = botao.getAttribute('aria-pressed') !== 'true';
    botao.setAttribute('aria-pressed', String(pausado));
    botao.closest('.letreiro').dataset.pausado = String(pausado);
    botao.querySelector('use').setAttribute('href', pausado ? '#i-play' : '#i-pause');
    botao.querySelector('.sr-only').textContent = pausado ? 'Retomar animação do letreiro' : 'Pausar animação do letreiro';
  });
}

// =====================================================================
// EVENTOS
// =====================================================================
// Event delegation: um listener no container serve todos os botões, inclusive os
// recriados por innerHTML (listeners individuais se perderiam a cada render).
function ligarEventos() {
  $('chips').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-cat]');
    if (!botao || botao.dataset.cat === estado.categoria) return;
    estado.categoria = botao.dataset.cat;
    atualizarChips();
    renderProdutos(true);
  });

  // Busca com pequeno "debounce" visual: anima só quando a pessoa para de digitar
  let timerBusca;
  $('busca').addEventListener('input', (e) => {
    estado.busca = e.target.value;
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => renderProdutos(true), 120);
  });

  // Adicionar: funciona tanto no cardápio quanto nas assinaturas
  document.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-add]');
    if (botao) adicionar(botao.dataset.add, botao);
  });

  $('itens').addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const { acao, id } = alvo.dataset;
    const sai = acao === 'remover' || (acao === 'menos' && estado.carrinho[id] === 1);

    const aplicar = () => {
      if (acao === 'remover') { delete estado.carrinho[id]; salvarCarrinho(); renderCarrinho(); }
      else alterarQuantidade(id, acao === 'mais' ? 1 : -1);
      // O render recriou a lista: devolve o foco ao mesmo botão ou, se o item saiu, ao próximo controle
      const mesmo = $('itens').querySelector(`[data-acao="${acao}"][data-id="${id}"]`);
      (mesmo || $('itens').querySelector('button') || $('btn-fechar')).focus();
    };

    if (sai && !reduzirMovimento()) {
      const linha = alvo.closest('.item');
      linha.classList.add('item--sai');
      setTimeout(aplicar, 200); // deixa a linha deslizar para fora antes de sumir
    } else aplicar();
  });

  $('btn-sacola').addEventListener('click', abrirGaveta);
  $('barra-pedido-btn').addEventListener('click', abrirGaveta);
  $('btn-fechar').addEventListener('click', fecharGaveta);
  $('btn-ver-cardapio').addEventListener('click', () => {
    focoAnterior = $('busca'); // ao fechar, o foco vai direto para a busca do cardápio
    fecharGaveta();
    document.getElementById('cardapio').scrollIntoView({ behavior: reduzirMovimento() ? 'auto' : 'smooth' });
  });

  const gaveta = $('gaveta');
  // Esc dispara "cancel": cancelamos o fechamento seco e fechamos com animação
  gaveta.addEventListener('cancel', (e) => { e.preventDefault(); fecharGaveta(); });
  // Clique no véu: o alvo é o próprio <dialog> (o painel cobre só a direita)
  gaveta.addEventListener('click', (e) => { if (e.target === gaveta) fecharGaveta(); });
  // O showModal() já deixa o fundo inerte, mas o Tab pode "escapar" para a barra do navegador.
  // Este loop garante o ciclo: no último elemento, Tab volta ao primeiro (e Shift+Tab faz o inverso).
  gaveta.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focaveis = [...gaveta.querySelectorAll('button, input, textarea, a[href]')]
      .filter((el) => !el.disabled && el.getClientRects().length > 0); // ignora o que está escondido
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });

  // Mostra o campo de endereço só quando escolhe "Entrega"
  $('pedido').addEventListener('change', (e) => {
    if (e.target.name !== 'entrega') return;
    const ehEntrega = e.target.value === 'Entrega';
    $('campo-endereco').hidden = !ehEntrega;
    if (!ehEntrega) marcarErro('endereco', '');
  });
  $('pedido').addEventListener('submit', enviarPedido);
  // Limpa o erro assim que a pessoa começa a corrigir
  ['nome', 'endereco'].forEach((id) => $(id).addEventListener('input', () => { if ($(id).value.trim()) marcarErro(id, ''); }));
}

// ---------- Início ----------
function iniciar() {
  carregarCarrinho();
  renderChips();
  renderAssinaturas();
  renderProdutos();
  renderCarrinho();
  renderStatus();
  setInterval(renderStatus, 60 * 1000); // o status muda sozinho (ex.: às 19h vira "Fechado")
  ligarEventos();
  iniciarLetreiro();
  iniciarHeader();
  iniciarParallax();
  iniciarRevelacao(); // depois de renderAssinaturas, para pegar os cards criados via JS
  iniciarHero();
}

iniciar();
