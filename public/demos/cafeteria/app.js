// app.js — lógica do Café Sertão.
// Organização: cada função faz UMA coisa. O fluxo é sempre:
//   evento do usuário -> muda o ESTADO -> chama render*() para redesenhar a tela.
// Assim o estado é a "fonte da verdade" e o HTML é só um reflexo dele.

const WHATSAPP_NUMBER = '5575900000000'; // TODO: número real
const STORAGE_KEY = 'cafe-sertao:carrinho';

// ---------- Estado ----------
const estado = {
  categoria: 'todos',
  busca: '',
  carrinho: {}, // { idDoProduto: quantidade } — guardar só o id evita duplicar dados do cardápio
};

// Intl.NumberFormat cria o formatador uma vez e reaproveita (mais barato que criar a cada preço).
const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl = (valor) => formatadorBRL.format(valor);

// Atalho para pegar elemento por id
const $ = (id) => document.getElementById(id);

// ---------- Persistência (localStorage) ----------
// try/catch porque localStorage pode lançar erro (modo anônimo, cota cheia, bloqueado pelo usuário).
// O site precisa continuar funcionando mesmo sem salvar.
function salvarCarrinho() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado.carrinho));
  } catch (e) { /* sem persistência: segue a vida */ }
}

function carregarCarrinho() {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Nunca confie no que vem do storage: o usuário (ou uma versão antiga do site) pode ter mudado.
    // Mantemos só ids que ainda existem no cardápio e quantidades inteiras positivas.
    for (const [id, qtd] of Object.entries(salvo)) {
      if (acharProduto(id) && Number.isInteger(qtd) && qtd > 0) estado.carrinho[id] = qtd;
    }
  } catch (e) { estado.carrinho = {}; }
}

// ---------- Cardápio: dados derivados ----------
function acharProduto(id) {
  return CARDAPIO.find((p) => p.id === id);
}

// Remove acentos e põe em minúsculas, para "pao" achar "Pão" e "Cafe" achar "café".
// normalize('NFD') separa a letra do acento; o regex remove os acentos soltos.
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Filtro = categoria E busca ao mesmo tempo. Retorna um array novo (não altera CARDAPIO).
function produtosFiltrados() {
  const termo = normalizar(estado.busca.trim());
  return CARDAPIO.filter((p) => {
    const naCategoria = estado.categoria === 'todos' || p.cat === estado.categoria;
    const naBusca = !termo || normalizar(p.nome + ' ' + p.desc).includes(termo);
    return naCategoria && naBusca;
  });
}

// ---------- Cardápio: render ----------
function renderChips() {
  $('chips').innerHTML = CATEGORIAS.map((c) =>
    // aria-pressed informa a leitores de tela qual filtro está ativo
    `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === estado.categoria}">${c.nome}</button>`
  ).join('');
}

function renderProdutos() {
  const lista = produtosFiltrados();
  $('resultado').textContent = `${lista.length} ${lista.length === 1 ? 'item encontrado' : 'itens encontrados'}`;

  if (lista.length === 0) {
    $('grade').innerHTML = '<li class="sem-resultado">Nada por aqui... tente outro termo ou categoria.</li>';
    return;
  }
  // Os textos vêm do nosso data.js (confiável), então innerHTML é seguro aqui.
  $('grade').innerHTML = lista.map((p) => `
    <li class="card">
      <div class="card__emoji" aria-hidden="true">${p.emoji}</div>
      <h3>${p.nome}</h3>
      <p class="card__desc">${p.desc}</p>
      <div class="card__rodape">
        <span class="card__preco">${brl(p.preco)}</span>
        <button class="btn btn--primario" type="button" data-add="${p.id}" aria-label="Adicionar ${p.nome} ao carrinho">Adicionar</button>
      </div>
    </li>`).join('');
}

// ---------- Carrinho: estado ----------
function alterarQuantidade(id, delta) {
  const nova = (estado.carrinho[id] || 0) + delta;
  if (nova <= 0) delete estado.carrinho[id]; // chegou a zero: remove do carrinho
  else estado.carrinho[id] = nova;
  salvarCarrinho();
  renderCarrinho();
}

function removerItem(id) {
  delete estado.carrinho[id];
  salvarCarrinho();
  renderCarrinho();
}

// Lista de linhas { produto, qtd } — usada tanto pelo render quanto pela mensagem do WhatsApp
function itensDoCarrinho() {
  return Object.entries(estado.carrinho).map(([id, qtd]) => ({ produto: acharProduto(id), qtd }));
}

function calcularSubtotal() {
  return itensDoCarrinho().reduce((soma, { produto, qtd }) => soma + produto.preco * qtd, 0);
}

function totalDeItens() {
  return Object.values(estado.carrinho).reduce((a, b) => a + b, 0);
}

// ---------- Carrinho: render ----------
function renderCarrinho() {
  const itens = itensDoCarrinho();

  $('itens').innerHTML = itens.map(({ produto: p, qtd }) => `
    <li class="item">
      <span class="item__nome">${p.emoji} ${p.nome}</span>
      <span class="item__preco">${brl(p.preco * qtd)}</span>
      <div class="item__controles" role="group" aria-label="Quantidade de ${p.nome}">
        <button class="qtd-btn" type="button" data-menos="${p.id}" aria-label="Diminuir quantidade de ${p.nome}">−</button>
        <span class="qtd" aria-live="polite">${qtd}</span>
        <button class="qtd-btn" type="button" data-mais="${p.id}" aria-label="Aumentar quantidade de ${p.nome}">+</button>
      </div>
      <button class="remover" type="button" data-remover="${p.id}" aria-label="Remover ${p.nome}">Remover</button>
    </li>`).join('');

  $('vazio').hidden = itens.length > 0;
  $('subtotal').textContent = brl(calcularSubtotal());

  const total = totalDeItens();
  $('badge').textContent = total;
  $('badge').setAttribute('aria-label', `${total} ${total === 1 ? 'item' : 'itens'} no carrinho`);
}

// ---------- WhatsApp ----------
// Monta o texto do pedido. Usa "\n" para quebras de linha; o encodeURIComponent depois
// transforma tudo (acentos, espaços, quebras) em algo seguro para ir dentro de uma URL.
function montarMensagem({ nome, entrega, obs }) {
  const linhas = itensDoCarrinho().map(({ produto: p, qtd }) =>
    `• ${qtd}x ${p.nome} — ${brl(p.preco * qtd)}`);

  return [
    '*Novo pedido — Café Sertão*',
    '',
    ...linhas,
    '',
    `*Total: ${brl(calcularSubtotal())}*`,
    `Recebimento: ${entrega}`,
    `Nome: ${nome}`,
    obs ? `Obs.: ${obs}` : null,
  ].filter((l) => l !== null).join('\n'); // filter remove a linha de obs quando está vazia
}

function enviarPedido() {
  const nome = $('nome').value.trim();
  const obs = $('obs').value.trim();
  const entrega = document.querySelector('input[name="entrega"]:checked').value;

  // Validação simples, com mensagem na tela (role="alert" faz o leitor de tela anunciar).
  if (totalDeItens() === 0) return mostrarErro('Adicione pelo menos um item ao carrinho.');
  if (!nome) { mostrarErro('Informe seu nome para continuar.'); $('nome').focus(); return; }
  mostrarErro('');

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(montarMensagem({ nome, entrega, obs }))}`;
  // noopener: a nova aba não ganha acesso à nossa janela (window.opener) — boa prática de segurança.
  window.open(url, '_blank', 'noopener');
}

function mostrarErro(texto) {
  $('erro').textContent = texto;
}

// ---------- Gaveta acessível ----------
let focoAnterior = null; // quem tinha o foco antes de abrir, para devolver ao fechar

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])';

function abrirGaveta() {
  focoAnterior = document.activeElement;
  $('gaveta').classList.add('aberta');
  $('veu').hidden = false;
  document.body.classList.add('sem-rolagem');
  $('btn-fechar').focus(); // move o foco para dentro do diálogo
  document.addEventListener('keydown', aoTeclarNaGaveta);
}

function fecharGaveta() {
  $('gaveta').classList.remove('aberta');
  $('veu').hidden = true;
  document.body.classList.remove('sem-rolagem');
  document.removeEventListener('keydown', aoTeclarNaGaveta);
  if (focoAnterior) focoAnterior.focus(); // devolve o foco a quem abriu
}

// Esc fecha; Tab fica "preso" dentro da gaveta (focus trap):
// no último elemento, Tab volta ao primeiro; no primeiro, Shift+Tab vai ao último.
function aoTeclarNaGaveta(e) {
  if (e.key === 'Escape') return fecharGaveta();
  if (e.key !== 'Tab') return;

  const focaveis = [...$('gaveta').querySelectorAll(FOCAVEIS)];
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];

  // A própria gaveta também recebe foco (clique numa área sem botão): conta como "início" da lista.
  if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === $('gaveta'))) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
}

// ---------- Eventos ----------
// Event delegation: um único listener no container serve todos os botões, mesmo os
// criados depois por innerHTML (que perderiam listeners individuais a cada render).
function ligarEventos() {
  $('chips').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-cat]');
    if (!botao) return;
    estado.categoria = botao.dataset.cat;
    renderChips();
    renderProdutos();
    $('chips').querySelector('[aria-pressed="true"]').focus(); // renderChips recriou os botões: restaura o foco
  });

  $('busca').addEventListener('input', (e) => {
    estado.busca = e.target.value;
    renderProdutos();
  });

  $('grade').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-add]');
    if (botao) alterarQuantidade(botao.dataset.add, 1);
  });

  $('itens').addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    // Guarda qual botão foi clicado: o render recria a lista e o foco se perderia.
    const [acao, id] = Object.entries(alvo.dataset)[0];
    if (acao === 'mais') alterarQuantidade(id, 1);
    if (acao === 'menos') alterarQuantidade(id, -1);
    if (acao === 'remover') removerItem(id);
    // Devolve o foco ao mesmo botão; se o item saiu do carrinho, vai para o próximo controle da gaveta.
    const mesmo = $('itens').querySelector(`[data-${acao}="${id}"]`);
    (mesmo || $('itens').querySelector('button') || $('nome')).focus();
  });

  $('btn-carrinho').addEventListener('click', abrirGaveta);
  $('btn-fechar').addEventListener('click', fecharGaveta);
  $('veu').addEventListener('click', fecharGaveta);
  $('btn-whats').addEventListener('click', enviarPedido);
}

// ---------- Início ----------
function iniciar() {
  carregarCarrinho();
  renderChips();
  renderProdutos();
  renderCarrinho();
  ligarEventos();
}

iniciar();
