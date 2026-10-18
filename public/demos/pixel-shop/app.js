/* ==========================================================================
   app.js — interface da loja: vitrine, filtros, modal e gaveta do carrinho.

   Depende (nesta ordem, via <script>): data.js, sprites.js, cart.js.
   Organização do arquivo:
     1. utilitários
     2. vitrine (filtro + ordenação + cards)
     3. camadas acessíveis (modal e gaveta compartilham a mesma lógica)
     4. modal de produto
     5. gaveta do carrinho (lista, cupom, checkout fake)
     6. inicialização
   ========================================================================== */

/* ---------- 1. Utilitários ---------- */

// Intl formata moeda conforme a região: "R$ 29,90". Não precisa de biblioteca.
const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarPreco = (centavos) => formatadorBRL.format(centavos / 100);

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

/**
 * Cria um elemento sem usar innerHTML. Mesmo com dados "de confiança", montar
 * pelo DOM é um bom hábito: textContent nunca interpreta HTML (evita XSS).
 */
function criar(tag, atributos = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (nome === 'class') no.className = valor;
    else if (nome === 'texto') no.textContent = valor;
    else no.setAttribute(nome, valor);
  }
  no.append(...filhos);
  return no;
}

let temporizadorAviso = null;
function avisar(mensagem) {
  const caixa = $('#aviso');
  caixa.textContent = mensagem;
  caixa.classList.add('aviso--visivel');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => caixa.classList.remove('aviso--visivel'), 2600);
}

/* ---------- 2. Vitrine ---------- */

const estado = { categoria: 'todas', ordem: 'novos' };

// Os 3 packs mais recentes ganham o selo "NOVO". Calculado a partir da data,
// assim não precisa lembrar de marcar à mão quando o catálogo crescer.
const idsNovos = new Set(
  [...PRODUTOS].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3).map((p) => p.id)
);

// Cada critério de ordenação é uma função de comparação para Array.sort.
const ordenadores = {
  novos: (a, b) => b.data.localeCompare(a.data),
  'preco-asc': (a, b) => a.preco - b.preco,
  'preco-desc': (a, b) => b.preco - a.preco,
  // localeCompare com 'pt-BR' ordena acentos corretamente ("Á" junto do "A").
  nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
};

function produtosVisiveis() {
  return PRODUTOS
    .filter((p) => estado.categoria === 'todas' || p.categoria === estado.categoria)
    .sort(ordenadores[estado.ordem]); // filter devolve cópia, então sort não muda PRODUTOS
}

function desenharFiltros() {
  const raiz = $('#filtros');
  const opcoes = [['todas', 'Todas'], ...Object.entries(CATEGORIAS)];
  opcoes.forEach(([chave, rotulo]) => {
    // aria-pressed deixa o leitor de tela anunciar "ativado/desativado".
    const botao = criar('button', { type: 'button', class: 'filtro', 'data-categoria': chave, texto: rotulo });
    botao.setAttribute('aria-pressed', String(chave === estado.categoria));
    raiz.append(botao);
  });
  raiz.addEventListener('click', (e) => {
    const botao = e.target.closest('.filtro');
    if (!botao) return;
    estado.categoria = botao.dataset.categoria;
    raiz.querySelectorAll('.filtro').forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
    desenharGrade();
  });
}

function criarCard(produto) {
  const titulo = criar('h3', { class: 'card__nome' });
  // O título é um botão: clicar no nome também abre o modal, e fica na ordem do Tab.
  const abrir = criar('button', { type: 'button', class: 'card__abrir', 'data-abrir': produto.id, texto: produto.nome });
  titulo.append(abrir);

  const previa = criar('div', { class: 'card__previa' }, criarCanvasDoProduto(produto, 'sprite'));
  if (idsNovos.has(produto.id)) previa.append(criar('span', { class: 'selo-novo', texto: 'NOVO' }));

  const adicionar = criar('button', { type: 'button', class: 'botao botao--pequeno', 'data-add': produto.id });

  return criar(
    'li',
    { class: 'card' },
    previa,
    criar('p', { class: 'etiqueta', texto: CATEGORIAS[produto.categoria] }),
    titulo,
    criar('p', { class: 'preco', texto: formatarPreco(produto.preco) }),
    adicionar
  );
}

function desenharGrade() {
  const lista = produtosVisiveis();
  const grade = $('#grade');
  grade.replaceChildren(...lista.map(criarCard));
  $('#contagem').textContent = `${lista.length} ${lista.length === 1 ? 'pack encontrado' : 'packs encontrados'}`;
  atualizarBotoesAdicionar();
}

/** Mantém todos os botões "Adicionar" coerentes com o carrinho. */
function atualizarBotoesAdicionar() {
  document.querySelectorAll('[data-add]').forEach((botao) => {
    const noCarrinho = Carrinho.tem(botao.dataset.add);
    botao.textContent = noCarrinho ? 'No carrinho ✓' : 'Adicionar';
    // aria-disabled (e não `disabled`) mantém o botão focável, então o foco
    // não some quando o usuário aperta Enter nele.
    botao.setAttribute('aria-disabled', String(noCarrinho));
  });
}

function adicionarAoCarrinho(id) {
  const produto = buscarProduto(id);
  if (Carrinho.adicionar(id)) {
    avisar(`${produto.nome} foi para o carrinho.`);
  } else {
    avisar(`${produto.nome} já está no carrinho (cada pack é vendido uma vez).`);
  }
}

/* ---------- 3. Camadas acessíveis (modal e gaveta) ---------- */

const SELETOR_FOCAVEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let camadaAberta = null; // { camada, caixa, gatilho }

/**
 * Abre uma camada (modal/gaveta) com o comportamento esperado de um diálogo:
 *  - o resto da página fica `inert` (não recebe foco nem clique, nem é lido);
 *  - o foco vai para dentro do diálogo;
 *  - Tab/Shift+Tab circulam só dentro dele ("focus trap");
 *  - Esc ou clique no fundo fecha;
 *  - ao fechar, o foco volta ao botão que abriu.
 */
function abrirCamada(camada, caixa, foco) {
  if (camadaAberta) return;
  camadaAberta = { camada, caixa, gatilho: document.activeElement };
  $('#pagina').inert = true;
  camada.hidden = false;
  document.body.classList.add('sem-rolagem');
  (foco || caixa).focus();
}

function fecharCamada() {
  if (!camadaAberta) return;
  const { camada, gatilho } = camadaAberta;
  camada.hidden = true;
  $('#pagina').inert = false;
  document.body.classList.remove('sem-rolagem');
  camadaAberta = null;
  // O gatilho pode ter sido recriado (ex.: grade redesenhada); nesse caso
  // cai no botão do carrinho em vez de perder o foco.
  (gatilho && gatilho.isConnected ? gatilho : $('#btn-carrinho')).focus();
}

document.addEventListener('keydown', (e) => {
  if (!camadaAberta) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    fecharCamada();
    return;
  }
  if (e.key !== 'Tab') return;

  const focaveis = [...camadaAberta.caixa.querySelectorAll(SELETOR_FOCAVEL)].filter((el) => !el.hidden && el.offsetParent !== null);
  if (focaveis.length === 0) {
    e.preventDefault();
    return;
  }
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  const dentro = camadaAberta.caixa.contains(document.activeElement);
  // Só interfere nas bordas: no meio da lista o Tab normal já funciona.
  if (e.shiftKey && (document.activeElement === primeiro || !dentro || document.activeElement === camadaAberta.caixa)) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) {
    e.preventDefault();
    primeiro.focus();
  }
});

// Clique no fundo escurecido (e não dentro da caixa) ou no X fecha.
document.addEventListener('click', (e) => {
  if (!camadaAberta) return;
  if (e.target === camadaAberta.camada || e.target.closest('[data-fechar]')) fecharCamada();
});

/* ---------- 4. Modal de produto ---------- */

let produtoDoModal = null;

function abrirModal(id) {
  const produto = buscarProduto(id);
  if (!produto) return;
  produtoDoModal = produto;

  $('#modal-previa').replaceChildren(criarCanvasDoProduto(produto, 'sprite sprite--grande'));
  $('#modal-categoria').textContent = CATEGORIAS[produto.categoria];
  $('#modal-titulo').textContent = produto.nome;
  $('#modal-descricao').textContent = produto.descricao;
  $('#modal-inclui').replaceChildren(...produto.inclui.map((item) => criar('li', { texto: item })));
  $('#modal-licenca').textContent = produto.licenca;
  $('#modal-preco').textContent = formatarPreco(produto.preco);
  $('#modal-add').dataset.add = produto.id; // reaproveita a mesma lógica dos botões da grade
  atualizarBotoesAdicionar();

  // Foco inicial no botão de fechar: é a saída mais segura para quem chegou aqui sem querer.
  abrirCamada($('#camada-modal'), $('#modal'), $('#modal .fechar'));
}

/* ---------- 5. Gaveta do carrinho ---------- */

// 'lista' = carrinho normal; 'obrigado' = tela depois do checkout fake.
let vistaGaveta = 'lista';
let ultimoPedido = null;

function desenharGaveta() {
  const raiz = $('#gaveta-conteudo');
  raiz.replaceChildren(vistaGaveta === 'obrigado' ? criarTelaObrigado() : criarTelaCarrinho());
}

function criarTelaCarrinho() {
  const r = Carrinho.resumo();
  const titulo = criar('h2', { id: 'gaveta-titulo', class: 'gaveta__titulo', tabindex: '-1', texto: 'Seu carrinho' });
  const bloco = criar('div', { class: 'gaveta__bloco' }, titulo);

  if (r.itens.length === 0) {
    bloco.append(criar('p', { class: 'vazio', texto: 'Nada por aqui ainda. Que tal um tileset?' }));
    bloco.append(criar('button', { type: 'button', class: 'botao', 'data-fechar': '', texto: 'Continuar vendo packs' }));
    return bloco;
  }

  const lista = criar('ul', { class: 'itens' });
  r.itens.forEach((p) => {
    lista.append(
      criar(
        'li',
        { class: 'item' },
        criarCanvasDoProduto(p, 'sprite sprite--mini'),
        criar('div', { class: 'item__info' }, criar('p', { class: 'item__nome', texto: p.nome }), criar('p', { class: 'preco', texto: formatarPreco(p.preco) })),
        criar('button', { type: 'button', class: 'botao botao--pequeno botao--perigo', 'data-remover': p.id, 'aria-label': `Remover ${p.nome}`, texto: 'Remover' })
      )
    );
  });
  bloco.append(lista);

  // Cupom fake. O <form> permite enviar com Enter e dá um label de verdade ao campo.
  const campo = criar('input', { id: 'cupom', type: 'text', autocomplete: 'off', autocapitalize: 'characters', placeholder: 'PIXEL10', 'aria-describedby': 'cupom-msg' });
  const msg = criar('p', { id: 'cupom-msg', class: 'cupom__msg', role: 'status' });
  if (r.cupom) msg.textContent = `Cupom ${r.cupom} aplicado: 10% de desconto.`;
  const form = criar(
    'form',
    { class: 'cupom', 'data-cupom': '' },
    criar('label', { for: 'cupom', texto: 'Cupom de desconto' }),
    criar('div', { class: 'cupom__linha' }, campo, criar('button', { type: 'submit', class: 'botao botao--pequeno', texto: 'Aplicar' })),
    msg
  );
  bloco.append(form);

  const linhas = criar('dl', { class: 'totais' });
  const linha = (rotulo, valor, classe = '') => linhas.append(criar('dt', { texto: rotulo }), criar('dd', { class: classe, texto: valor }));
  linha('Subtotal', formatarPreco(r.subtotal));
  if (r.desconto > 0) linha(`Desconto (${r.cupom})`, `- ${formatarPreco(r.desconto)}`, 'desconto');
  linha('Total', formatarPreco(r.total), 'total');
  bloco.append(linhas);

  bloco.append(criar('button', { type: 'button', class: 'botao botao--primario botao--cheio', 'data-checkout': '', texto: 'Finalizar compra (demo)' }));
  bloco.append(criar('p', { class: 'demo-aviso', texto: 'DEMO: nenhum pagamento real é feito.' }));
  return bloco;
}

function criarTelaObrigado() {
  return criar(
    'div',
    { class: 'gaveta__bloco gaveta__bloco--obrigado' },
    criar('h2', { id: 'gaveta-titulo', class: 'gaveta__titulo', tabindex: '-1', texto: 'Obrigado!' }),
    criar('p', { texto: `Pedido ${ultimoPedido.codigo} registrado com ${ultimoPedido.quantidade} ${ultimoPedido.quantidade === 1 ? 'pack' : 'packs'}, no valor de ${formatarPreco(ultimoPedido.total)}.` }),
    criar('p', { class: 'demo-aviso', texto: 'DEMO: isto foi uma simulação. Nada foi cobrado e nenhum arquivo será enviado.' }),
    criar('button', { type: 'button', class: 'botao botao--primario', 'data-fechar': '', texto: 'Voltar à loja' })
  );
}

function abrirGaveta() {
  vistaGaveta = 'lista';
  desenharGaveta();
  abrirCamada($('#camada-gaveta'), $('#gaveta'), $('#gaveta-titulo'));
}

function finalizarCompra() {
  const r = Carrinho.resumo();
  if (r.itens.length === 0) return;
  // Código de pedido só para parecer real; não é enviado a lugar nenhum.
  ultimoPedido = { codigo: '#PX' + Math.floor(1000 + Math.random() * 9000), quantidade: r.itens.length, total: r.total };
  vistaGaveta = 'obrigado'; // define a vista ANTES de limpar, pois limpar() redesenha a gaveta
  Carrinho.limpar();
  $('#gaveta-titulo').focus(); // o botão clicado sumiu: leva o foco para o novo título
}

const gaveta = $('#gaveta');

gaveta.addEventListener('click', (e) => {
  const remover = e.target.closest('[data-remover]');
  if (remover) {
    const produto = buscarProduto(remover.dataset.remover);
    Carrinho.remover(remover.dataset.remover);
    avisar(`${produto.nome} removido do carrinho.`);
    // O botão clicado foi destruído no redesenho: devolve o foco ao título.
    $('#gaveta-titulo').focus();
    return;
  }
  if (e.target.closest('[data-checkout]')) finalizarCompra();
});

gaveta.addEventListener('submit', (e) => {
  e.preventDefault();
  const codigo = $('#cupom').value;
  const ok = Carrinho.aplicarCupom(codigo);
  // O redesenho recria a mensagem; escrevemos nela depois, já no DOM novo.
  const msg = $('#cupom-msg');
  if (ok) {
    avisar('Cupom aplicado.');
    $('#cupom').focus(); // o formulário foi recriado: recoloca o foco no campo
  } else {
    msg.textContent = 'Cupom inválido. Dica: PIXEL10.';
    msg.classList.add('cupom__msg--erro');
    $('#cupom').focus();
  }
});

function atualizarSelo() {
  const total = Carrinho.quantidade();
  $('#selo-carrinho').textContent = String(total);
  $('#btn-carrinho').setAttribute('aria-label', `Abrir carrinho, ${total} ${total === 1 ? 'item' : 'itens'}`);
}

/* ---------- 6. Inicialização ---------- */

function iniciar() {
  // Logo: reaproveita o sprite da gema, só para mostrar o desenhador em ação.
  const gema = buscarProduto('gemas-moedas');
  $('#logo-sprite').append(criarCanvasDoProduto(gema, 'sprite sprite--logo'));

  desenharFiltros();
  desenharGrade();
  atualizarSelo();

  $('#ordem').addEventListener('change', (e) => {
    estado.ordem = e.target.value;
    desenharGrade();
  });

  // Delegação de eventos: um único listener na grade serve todos os cards,
  // inclusive os recriados a cada filtro/ordenação.
  $('#grade').addEventListener('click', (e) => {
    const abrir = e.target.closest('[data-abrir]');
    if (abrir) return abrirModal(abrir.dataset.abrir);
    const add = e.target.closest('[data-add]');
    if (add) adicionarAoCarrinho(add.dataset.add);
  });

  $('#modal-add').addEventListener('click', () => adicionarAoCarrinho(produtoDoModal.id));
  $('#btn-carrinho').addEventListener('click', abrirGaveta);

  // Sempre que o carrinho muda: selo, botões e (se aberta) a gaveta.
  Carrinho.assinar(() => {
    atualizarSelo();
    atualizarBotoesAdicionar();
    if (camadaAberta && camadaAberta.caixa === gaveta) desenharGaveta();
  });
}

iniciar();
