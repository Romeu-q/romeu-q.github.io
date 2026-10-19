/* ==========================================================================
   app.js — junta tudo: vitrine, filtros, modal do produto e carrinho.

   Mapa do arquivo:
     1. estado da vitrine (filtro, ordem, busca)
     2. cards (criados UMA vez e reaproveitados)
     3. vitrine com animação FLIP
     4. adicionar ao carrinho (+ "voo" do sprite até o botão)
     5. modal do produto (zoom, grade, play/pause, paleta)
     6. gaveta do carrinho (lista, cupom, checkout de demonstração)
     7. inicialização
   ========================================================================== */

/* ---------- 1. Estado ---------- */

const estado = { categoria: 'todos', ordem: 'destaques', busca: '' };

// "Novo" é relativo ao pack mais recente do catálogo, e não à data de hoje:
// assim a demo não "envelhece" e perde os selos daqui a alguns meses.
const DATA_MAIS_RECENTE = Math.max(...PRODUTOS.map((p) => Date.parse(p.data)));
const ehNovo = (p) => DATA_MAIS_RECENTE - Date.parse(p.data) <= 45 * 864e5;

/** Remove acentos e caixa: "Poções" encontra "pocoes". */
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function produtosVisiveis() {
  const termo = normalizar(estado.busca.trim());
  const lista = PRODUTOS.filter((p) => {
    if (estado.categoria !== 'todos' && p.categoria !== estado.categoria) return false;
    if (!termo) return true;
    return normalizar(`${p.nome} ${p.resumo} ${CATEGORIAS[p.categoria]}`).includes(termo);
  });
  const ordenadores = {
    destaques: (a, b) => a.destaque - b.destaque,
    novos: (a, b) => b.data.localeCompare(a.data),
    'preco-asc': (a, b) => a.preco - b.preco,
    'preco-desc': (a, b) => b.preco - a.preco,
    nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
  };
  // sort() altera o array original: como `filter` já criou uma cópia, tudo bem.
  return lista.sort(ordenadores[estado.ordem]);
}

/* ---------- 2. Cards ---------- */

const cards = new Map(); // id -> <li>

function precoHTML(p) {
  const promo = p.precoOriginal
    ? `<s><span class="sr">de </span>${formatarPreco(p.precoOriginal)}</s> <span class="sr">por </span>`
    : '';
  return `${promo}<span class="preco__valor">${formatarPreco(p.preco)}</span>`;
}

function criarCard(p) {
  const selos = criar('div', { class: 'card__selos' });
  if (p.precoOriginal) selos.append(criar('span', { class: 'selo selo--promo', texto: `−${Math.round((1 - p.preco / p.precoOriginal) * 100)}%` }));
  if (ehNovo(p)) selos.append(criar('span', { class: 'selo selo--novo', texto: 'Novo' }));

  const capa = criar(
    'div',
    { class: 'card__capa' },
    criar('span', { class: 'card__chao', 'aria-hidden': 'true' }),
    Animador.criar(p.sprite, p.paleta, 'card__sprite'),
    selos
  );

  const li = criar(
    'li',
    { class: 'card', 'data-id': p.id, style: `--tom: ${p.tom}` },
    criar(
      'article',
      { class: 'card__corpo' },
      capa,
      criar(
        'div',
        { class: 'card__info' },
        criar('p', { class: 'card__cat', texto: CATEGORIAS[p.categoria] }),
        // O botão do título "estica" (::after) por cima do card inteiro:
        // o card todo é clicável, mas para o leitor de tela é UM botão com
        // nome claro — sem botões aninhados (HTML inválido).
        criar('h3', { class: 'card__titulo' }, criar('button', { type: 'button', class: 'card__abrir', 'data-abrir': p.id, texto: p.nome })),
        criar('p', { class: 'card__resumo', texto: p.resumo }),
        criar('ul', { class: 'card__specs', 'aria-label': 'Especificações' }, ...p.specs.map((s) => criar('li', { texto: s }))),
        criar(
          'div',
          { class: 'card__rodape' },
          criar('p', { class: 'preco', html: precoHTML(p) }),
          criar('button', { type: 'button', class: 'btn btn--add', 'data-add': p.id })
        )
      )
    ),
    criar('span', { class: 'card__brilho', 'aria-hidden': 'true' })
  );
  ativarTilt(li, $('.card__corpo', li));
  return li;
}

/** Deixa todo botão [data-add] coerente com o carrinho. */
function atualizarBotoesAdicionar() {
  $$('[data-add]').forEach((botao) => {
    const p = buscarProduto(botao.dataset.add);
    const dentro = Carrinho.tem(p.id);
    botao.classList.toggle('no-carrinho', dentro);
    // Já no carrinho? O botão vira atalho para o carrinho (em vez de ficar
    // desabilitado e "morto"): continua útil e continua focável.
    botao.innerHTML = dentro
      ? `${icone('check')}<span>No carrinho</span><span class="sr">: ${p.nome}. Abrir carrinho</span>`
      : `${icone('carrinho')}<span>Adicionar</span><span class="sr"> ${p.nome} ao carrinho</span>`;
  });
}

/* ---------- 3. Vitrine com FLIP ----------
   FLIP = First, Last, Invert, Play:
   - First: mede onde cada card está ANTES da mudança;
   - Last: aplica a mudança no DOM (filtra/reordena) e mede de novo;
   - Invert: com transform, "devolve" cada card visualmente à posição antiga;
   - Play: anima o transform até zero.
   O layout muda de uma vez só (barato) e o que anima é só transform. */

function atualizarVitrine({ animar = true } = {}) {
  const lista = produtosVisiveis();
  const grade = $('#grade');
  const comAnimacao = animar && !Movimento.reduzido;
  const novos = new Set(lista.map((p) => p.id));

  // Cards que estavam saindo de uma animação anterior: tira de vez.
  $$('.card--saindo', grade).forEach((li) => {
    li.getAnimations().forEach((a) => a.cancel());
    li.classList.remove('card--saindo');
    li.removeAttribute('style');
    li.style.setProperty('--tom', buscarProduto(li.dataset.id).tom);
    li.remove();
  });

  // FIRST
  const antes = new Map();
  $$('.card', grade).forEach((li) => {
    li.getAnimations().forEach((a) => a.finish());
    antes.set(li.dataset.id, li.getBoundingClientRect());
  });
  const caixaGrade = grade.getBoundingClientRect();

  // Se o foco está num card que vai sumir, guarda num lugar estável.
  const focoSaindo = document.activeElement && document.activeElement.closest('.card') && !novos.has(document.activeElement.closest('.card').dataset.id);

  // Saída: o card vira absoluto na posição atual e desaparece.
  antes.forEach((r, id) => {
    if (novos.has(id)) return;
    const li = cards.get(id);
    if (!comAnimacao) return li.remove();
    li.classList.add('card--saindo');
    Object.assign(li.style, {
      position: 'absolute',
      left: r.left - caixaGrade.left + 'px',
      top: r.top - caixaGrade.top + 'px',
      width: r.width + 'px',
      height: r.height + 'px',
    });
    li.inert = true;
    Movimento.animar(li, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 180, easing: EASE_ENTRADA, fill: 'forwards' })
      .finished.then(() => {
        if (!li.classList.contains('card--saindo')) return;
        // fill:'forwards' mantém opacity 0 mesmo depois de terminar: cancelamos
        // para o card voltar normal quando o filtro o trouxer de volta.
        li.getAnimations().forEach((anim) => anim.cancel());
        li.classList.remove('card--saindo');
        li.removeAttribute('style');
        li.style.setProperty('--tom', buscarProduto(id).tom);
        li.inert = false;
        li.remove();
      })
      .catch(() => {});
  });

  // LAST: reordena (append move o nó se ele já existe).
  lista.forEach((p) => grade.append(cards.get(p.id)));
  lista.forEach((p) => (cards.get(p.id).inert = false));

  // INVERT + PLAY
  if (comAnimacao) {
    let atraso = 0;
    lista.forEach((p) => {
      const li = cards.get(p.id);
      const r0 = antes.get(p.id);
      if (r0) {
        const r1 = li.getBoundingClientRect();
        const dx = r0.left - r1.left;
        const dy = r0.top - r1.top;
        if (dx || dy) Movimento.animar(li, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 360, easing: EASE_SAIDA });
      } else {
        Movimento.animar(li, [{ opacity: 0, transform: 'translateY(14px) scale(.94)' }, { opacity: 1, transform: 'none' }], {
          duration: 300,
          delay: 80 + atraso,
          easing: EASE_SAIDA,
          fill: 'backwards',
        });
        atraso += 35;
      }
    });
  }

  if (focoSaindo) $('#filtros [aria-pressed="true"]').focus();

  // Contagem (lida pelo leitor de tela via role=status) e estado vazio.
  const nomeCategoria = estado.categoria === 'todos' ? '' : ` em ${CATEGORIAS[estado.categoria]}`;
  $('#contagem').textContent = `${lista.length} ${lista.length === 1 ? 'pack' : 'packs'}${nomeCategoria}${estado.busca.trim() ? ` para “${estado.busca.trim()}”` : ''}`;
  const vazio = $('#vazio');
  const estavaVazio = !vazio.hidden;
  vazio.hidden = lista.length > 0;
  if (lista.length === 0) {
    $('#vazio-texto').textContent = estado.busca.trim()
      ? `Nada encontrado para “${estado.busca.trim()}”${nomeCategoria}. Que tal outra palavra?`
      : 'Nenhum pack nesta categoria ainda.';
    if (!estavaVazio) Movimento.animar(vazio, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], 260);
  }
}

function montarFiltros() {
  const contagem = (cat) => (cat === 'todos' ? PRODUTOS.length : PRODUTOS.filter((p) => p.categoria === cat).length);
  const opcoes = [['todos', 'Todos'], ...Object.entries(CATEGORIAS)];
  $('#filtros').replaceChildren(
    ...opcoes.map(([valor, rotulo]) =>
      criar(
        'button',
        { type: 'button', class: 'chip', 'data-categoria': valor, 'aria-pressed': String(valor === estado.categoria) },
        criar('span', { texto: rotulo }),
        criar('span', { class: 'chip__n', texto: contagem(valor), 'aria-hidden': 'true' })
      )
    )
  );
}

/* ---------- 4. Adicionar ao carrinho ---------- */

function adicionar(id, origem) {
  const p = buscarProduto(id);
  if (Carrinho.tem(id)) {
    abrirCarrinho();
    return;
  }
  Carrinho.adicionar(id);
  voarAteCarrinho(origem);
  Toast.mostrar(`${p.nome} foi para o carrinho.`, { acao: { rotulo: 'Ver carrinho', fn: abrirCarrinho } });
}

/** Um clone do sprite "voa" do card até o botão do carrinho. */
function voarAteCarrinho(origem) {
  const alvo = $('#btn-carrinho');
  const pular = () => Movimento.animar($('#selo-carrinho'), [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  const sprite = origem && origem.closest('.card, .painel') && $('canvas.sprite', origem.closest('.card, .painel'));
  if (!sprite || Movimento.reduzido || Dialogo.aberto) return pular();

  const r0 = sprite.getBoundingClientRect();
  const r1 = alvo.getBoundingClientRect();
  const clone = criar('canvas', { class: 'sprite voador', 'aria-hidden': 'true' });
  clone.width = sprite.width;
  clone.height = sprite.height;
  clone.getContext('2d').drawImage(sprite, 0, 0);
  Object.assign(clone.style, { left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px' });
  document.body.append(clone);
  const dx = r1.left + r1.width / 2 - (r0.left + r0.width / 2);
  const dy = r1.top + r1.height / 2 - (r0.top + r0.height / 2);
  // Arco: sobe um pouco no meio do caminho (offset 0.5) antes de descer.
  Movimento.animar(
    clone,
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.6)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.18)`, opacity: 0.4 },
    ],
    { duration: 620, easing: 'cubic-bezier(.45,0,.55,1)' }
  ).finished.then(() => {
    clone.remove();
    pular();
  });
}

function atualizarSelo() {
  const n = Carrinho.quantidade();
  $('#selo-carrinho').textContent = n;
  $('#selo-carrinho').classList.toggle('zerado', n === 0);
  $('#sr-carrinho').textContent = n === 0 ? 'vazio' : `${n} ${n === 1 ? 'item' : 'itens'}`;
}

/* ---------- 5. Modal do produto ---------- */

const modal = { produto: null, canvas: null, zoom: 2 };
const ESCALA_ZOOM = { 1: 4, 2: 8, 4: 16 }; // px de tela por pixel do sprite

function aplicarZoom(z) {
  modal.zoom = z;
  const tamanho = 16 * ESCALA_ZOOM[z];
  const alvo = $('#mp-sprite');
  const de = alvo.offsetWidth || tamanho;
  alvo.style.setProperty('--tam', tamanho + 'px');
  alvo.style.setProperty('--px', ESCALA_ZOOM[z] + 'px');
  // Anima a escala (e não width/height): transform não força relayout.
  if (de !== tamanho) Movimento.animar(alvo, [{ transform: `scale(${de / tamanho})` }, { transform: 'scale(1)' }], { duration: 260, easing: EASE_SAIDA });
  $$('[data-zoom]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.zoom) === z)));
}

function atualizarPlay() {
  const pausado = Movimento.reduzido || Animador.estado(modal.canvas).pausado;
  const b = $('#mp-play');
  b.setAttribute('aria-pressed', String(pausado));
  b.setAttribute('aria-label', pausado ? 'Reproduzir animação' : 'Pausar animação');
  b.innerHTML = icone(pausado ? 'play' : 'pausa');
}

function abrirProduto(id) {
  const p = buscarProduto(id);
  if (!p) return;
  modal.produto = p;
  modal.canvas = Animador.criar(p.sprite, p.paleta, 'mp__canvas');
  $('#mp-sprite').replaceChildren(modal.canvas);
  $('#mp-tela').style.setProperty('--tom', p.tom);
  $('#mp-cat').textContent = CATEGORIAS[p.categoria] + (ehNovo(p) ? ' · Novo' : '');
  $('#mp-titulo').textContent = p.nome;
  $('#mp-desc').textContent = p.descricao;
  $('#mp-paleta').replaceChildren(
    ...p.paleta.map((cor) =>
      criar('li', {}, criar('button', { type: 'button', class: 'amostra', style: `--cor: ${cor}`, 'data-cor': cor, 'aria-label': `Copiar cor ${cor}`, title: cor }))
    )
  );
  $('#mp-inclui').replaceChildren(...p.inclui.map((item) => criar('li', { html: icone('check') }, item)));
  $('#mp-licenca').textContent = p.licenca;
  $('#mp-preco').innerHTML = precoHTML(p);
  $('#mp-add').dataset.add = p.id;
  atualizarBotoesAdicionar();

  // Zoom inicial que cabe na tela (4x = 256px não cabe bem em celulares pequenos).
  aplicarZoom(innerWidth < 380 ? 2 : modal.zoom);
  atualizarPlay();
  $('#mp-quadro').hidden = Movimento.reduzido;
  Dialogo.abrir($('#modal'), { foco: $('#mp-titulo') });
  $('.painel--modal').scrollTop = 0;
}

// Contador de quadros da prévia (só enquanto o modal está aberto).
function contarQuadros() {
  if (Dialogo.aberto === $('#modal') && modal.canvas) {
    const e = Animador.estado(modal.canvas);
    if (e) $('#mp-quadro').textContent = `${e.quadro + 1}/${e.total}`;
  }
  requestAnimationFrame(contarQuadros);
}

/* ---------- 6. Gaveta do carrinho ---------- */

let vistaGaveta = 'lista'; // 'lista' | 'concluido'
let pedidoConcluido = null;

function abrirCarrinho() {
  const abrir = () => {
    // Avisos "Ver carrinho" perdem o sentido com o carrinho aberto (e no
    // celular cobririam o botão de finalizar).
    $$('#toasts .toast').forEach((t) => t.remove());
    if (vistaGaveta === 'concluido' && Carrinho.quantidade() > 0) vistaGaveta = 'lista';
    renderizarGaveta();
    Dialogo.abrir($('#gaveta'), { foco: $('#gaveta-titulo') });
  };
  // Vindo do modal do produto: fecha um e abre o outro, sem perder o gatilho.
  if (Dialogo.aberto) Dialogo.fechar({ devolverFoco: false }).then(abrir);
  else abrir();
}

function linhaTotal(rotulo, valor, classe = '') {
  return criar('div', { class: `totais__linha ${classe}` }, criar('dt', { texto: rotulo }), criar('dd', { texto: valor }));
}

function vistaVazia() {
  return criar(
    'div',
    { class: 'gaveta__vazio' },
    Animador.criar('slimeTriste', PALETAS_EXTRA.slimeTriste, 'gaveta__vazio-sprite'),
    criar('h3', { texto: 'Seu carrinho está vazio' }),
    criar('p', { texto: 'Este slime está esperando companhia. Que tal dar uma olhada nos packs?' }),
    criar('button', {
      type: 'button',
      class: 'btn btn--primario',
      html: `Explorar packs ${icone('seta')}`,
      onclick: () => Dialogo.fechar({ devolverFoco: false }).then(() => irParaVitrine()),
    })
  );
}

function vistaLista(r) {
  const itens = criar(
    'ul',
    { class: 'itens', 'aria-label': 'Itens no carrinho' },
    ...r.itens.map((p) =>
      criar(
        'li',
        { class: 'item', 'data-item': p.id, style: `--tom: ${p.tom}` },
        criar('span', { class: 'item__miniatura' }, Animador.criar(p.sprite, p.paleta, 'item__sprite')),
        criar('div', { class: 'item__info' }, criar('p', { class: 'item__nome', texto: p.nome }), criar('p', { class: 'item__cat', texto: CATEGORIAS[p.categoria] })),
        criar('p', { class: 'item__preco', texto: formatarPreco(p.preco) }),
        criar('button', { type: 'button', class: 'btn-icone btn-icone--perigo', 'data-remover': p.id, 'aria-label': `Remover ${p.nome}`, html: icone('lixo') })
      )
    )
  );

  // Cupom: formulário OU selo de "aplicado" (estado de sucesso).
  let cupom;
  if (r.cupom) {
    cupom = criar(
      'div',
      { class: 'cupom cupom--ok' },
      criar('span', { class: 'cupom__selo', html: `${icone('check')}<span><strong>${r.cupom}</strong> aplicado · ${r.percentual}% off</span>` }),
      criar('button', { type: 'button', class: 'link', 'data-remover-cupom': '', texto: 'Remover' })
    );
  } else {
    cupom = criar(
      'form',
      { class: 'cupom', 'data-cupom': '', novalidate: true },
      criar('label', { for: 'cupom-campo', class: 'cupom__rotulo', texto: 'Cupom de desconto' }),
      criar(
        'div',
        { class: 'cupom__linha' },
        criar('input', { id: 'cupom-campo', name: 'cupom', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Ex.: PIXEL10', 'aria-describedby': 'cupom-msg' }),
        criar('button', { type: 'submit', class: 'btn btn--secundario', texto: 'Aplicar' })
      ),
      criar('p', { id: 'cupom-msg', class: 'cupom__msg', 'aria-live': 'polite' })
    );
  }

  const totais = criar(
    'dl',
    { class: 'totais' },
    linhaTotal('Subtotal', formatarPreco(r.subtotal)),
    r.desconto ? linhaTotal(`Desconto (${r.cupom})`, `− ${formatarPreco(r.desconto)}`, 'totais__linha--desconto') : null,
    linhaTotal('Total', formatarPreco(r.total), 'totais__linha--total')
  );

  const finalizar = criar('button', { type: 'button', class: 'btn btn--primario btn--cheio', 'data-checkout': '', html: `Finalizar pedido de demonstração` });

  return criar(
    'div',
    { class: 'gaveta__lista' },
    criar('div', { class: 'gaveta__rolagem' }, itens),
    criar('div', { class: 'gaveta__rodape' }, cupom, totais, finalizar, criar('p', { class: 'gaveta__aviso', texto: 'Demo: nenhum pagamento é processado e nenhum dado é enviado.' }))
  );
}

function vistaConcluido() {
  const r = pedidoConcluido;
  return criar(
    'div',
    { class: 'gaveta__concluido' },
    Animador.criar('moeda', PALETAS_EXTRA.moeda, 'concluido__moeda'),
    criar('p', { class: 'concluido__codigo', texto: `Pedido ${r.codigo}` }),
    criar('h3', { class: 'concluido__titulo', tabindex: '-1', texto: 'Pedido de demonstração confirmado!' }),
    criar('p', { class: 'concluido__alerta', html: `${icone('escudo')}<span><strong>Nada foi cobrado.</strong> Esta loja é fictícia e nenhum dado saiu do seu navegador.</span>` }),
    criar(
      'ul',
      { class: 'concluido__itens' },
      ...r.itens.map((p) => criar('li', {}, criar('span', { texto: p.nome }), criar('span', { texto: formatarPreco(p.preco) })))
    ),
    criar('p', { class: 'concluido__total' }, criar('span', { texto: r.desconto ? `Total com ${r.cupom}` : 'Total' }), criar('strong', { texto: formatarPreco(r.total) })),
    criar('button', { type: 'button', class: 'btn btn--secundario btn--cheio', 'data-fechar': '', texto: 'Voltar à loja' })
  );
}

function renderizarGaveta(foco) {
  const r = Carrinho.resumo();
  const conteudo = $('#gaveta-conteudo');
  const vista = vistaGaveta === 'concluido' ? vistaConcluido() : r.itens.length ? vistaLista(r) : vistaVazia();
  conteudo.replaceChildren(vista);
  $('#gaveta-titulo').textContent = vistaGaveta === 'concluido' ? 'Obrigado!' : `Seu carrinho${r.itens.length ? ` (${r.itens.length})` : ''}`;
  if (foco) {
    const alvo = typeof foco === 'string' ? $(foco, conteudo) : foco;
    (alvo || $('#gaveta-titulo')).focus({ preventScroll: true });
  }
}

async function removerItem(id) {
  const li = $(`[data-item="${id}"]`);
  const irmaos = $$('[data-item]');
  const i = irmaos.indexOf(li);
  const proximo = irmaos[i + 1] || irmaos[i - 1];
  // Anima o item saindo (altura colapsa) ANTES de mudar o estado.
  if (li) {
    li.style.overflow = 'hidden';
    await Movimento.animar(
      li,
      [
        { opacity: 1, transform: 'none', height: li.offsetHeight + 'px' },
        { opacity: 0, transform: 'translateX(24px)', height: li.offsetHeight + 'px', offset: 0.6 },
        { opacity: 0, transform: 'translateX(24px)', height: '0px', paddingBlock: '0px', marginBlock: '0px' },
      ],
      { duration: 280, easing: EASE_SAIDA, fill: 'forwards' }
    ).finished;
  }
  const nome = buscarProduto(id).nome;
  Carrinho.remover(id);
  renderizarGaveta(proximo ? `[data-remover="${proximo.dataset.item}"]` : null);
  Toast.mostrar(`${nome} saiu do carrinho.`, { tipo: 'info', acao: { rotulo: 'Desfazer', fn: () => Carrinho.adicionar(id) } });
}

function aplicarCupom(form) {
  const campo = $('#cupom-campo', form);
  const msg = $('#cupom-msg', form);
  const codigo = campo.value.trim();
  if (!codigo) {
    msg.textContent = 'Digite um código. Dica: PIXEL10.';
    campo.focus();
    return;
  }
  if (Carrinho.aplicarCupom(codigo)) {
    renderizarGaveta('[data-remover-cupom]');
    const selo = $('.cupom__selo');
    Movimento.animar(selo, [{ transform: 'scale(.85)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 360 });
    Movimento.animar($('.totais__linha--desconto'), [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], 260);
    Toast.mostrar('Cupom PIXEL10 aplicado: 10% de desconto!');
  } else {
    msg.textContent = `“${codigo}” não é um cupom válido. Tente PIXEL10.`;
    campo.setAttribute('aria-invalid', 'true');
    Movimento.animar(campo.parentElement, [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], 300);
    campo.select();
  }
}

async function finalizarPedido(botao) {
  botao.disabled = true;
  botao.setAttribute('aria-busy', 'true');
  botao.innerHTML = `<span class="carregando" aria-hidden="true"></span> Processando…`;
  // Espera curta e falsa: só para a transição não parecer "teletransporte".
  await new Promise((ok) => setTimeout(ok, Movimento.reduzido ? 0 : 900));

  const r = Carrinho.resumo();
  // Código só para parecer real; não é enviado a lugar nenhum.
  pedidoConcluido = { ...r, codigo: '#PX-' + Math.random().toString(36).slice(2, 7).toUpperCase() };
  vistaGaveta = 'concluido'; // define ANTES de limpar: limpar() redesenha a gaveta
  Carrinho.limpar();
  renderizarGaveta('.concluido__titulo');

  const vista = $('.gaveta__concluido');
  Movimento.animar(vista, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 320);
  const moeda = $('.concluido__moeda').getBoundingClientRect();
  confete(moeda.left + moeda.width / 2, moeda.top + moeda.height / 2);
}

/* ---------- 7. Inicialização ---------- */

function irParaVitrine() {
  const vitrine = $('#vitrine');
  vitrine.scrollIntoView({ behavior: Movimento.reduzido ? 'auto' : 'smooth' });
  vitrine.focus({ preventScroll: true });
}

function iniciar() {
  hidratarIcones();

  // Sprites estáticos da página (logo, flutuantes do herói, estado vazio).
  $('#logo-moeda').append(Animador.criar('moeda', PALETAS_EXTRA.moeda, 'logo__sprite'));
  $$('[data-sprite]').forEach((el) => {
    const p = buscarProduto(el.dataset.sprite);
    el.append(Animador.criar(p.sprite, p.paleta));
  });
  $('#vazio-sprite').append(Animador.criar('slimeTriste', PALETAS_EXTRA.slimeTriste));

  PRODUTOS.forEach((p) => cards.set(p.id, criarCard(p)));
  montarFiltros();
  atualizarVitrine({ animar: false });
  atualizarBotoesAdicionar();
  atualizarSelo();
  Cena.iniciar();
  requestAnimationFrame(contarQuadros);

  // O carrinho avisa; a UI redesenha o que depende dele.
  Carrinho.assinar((motivo) => {
    atualizarBotoesAdicionar();
    atualizarSelo();
    // Desfazer remoção com a gaveta aberta: redesenha a lista.
    if (Dialogo.aberto === $('#gaveta') && vistaGaveta === 'lista' && motivo === 'adicionar') renderizarGaveta();
  });

  /* --- eventos (delegação: um ouvinte no documento serve para todos os
         cards, inclusive os que forem criados depois) --- */
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) return adicionar(add.dataset.add, add);

    const abrir = e.target.closest('[data-abrir]');
    if (abrir) return abrirProduto(abrir.dataset.abrir);

    const chip = e.target.closest('[data-categoria]');
    if (chip) {
      if (estado.categoria === chip.dataset.categoria) return;
      estado.categoria = chip.dataset.categoria;
      $$('#filtros .chip').forEach((b) => b.setAttribute('aria-pressed', String(b === chip)));
      return atualizarVitrine();
    }

    const zoom = e.target.closest('[data-zoom]');
    if (zoom) return aplicarZoom(Number(zoom.dataset.zoom));

    const amostra = e.target.closest('[data-cor]');
    if (amostra) {
      copiarTexto(amostra.dataset.cor).then((ok) => Toast.mostrar(ok ? `Cor ${amostra.dataset.cor} copiada.` : `Cor ${amostra.dataset.cor}`, { tipo: 'info' }));
      return;
    }

    const remover = e.target.closest('[data-remover]');
    if (remover) return removerItem(remover.dataset.remover);

    if (e.target.closest('[data-remover-cupom]')) {
      Carrinho.removerCupom();
      renderizarGaveta('#cupom-campo');
      return;
    }

    const checkout = e.target.closest('[data-checkout]');
    if (checkout) return finalizarPedido(checkout);
  });

  document.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-cupom]')) return;
    e.preventDefault();
    aplicarCupom(e.target);
  });

  // Limpa o estado de erro do cupom assim que a pessoa volta a digitar.
  document.addEventListener('input', (e) => {
    if (e.target.id === 'cupom-campo') {
      e.target.removeAttribute('aria-invalid');
      $('#cupom-msg').textContent = '';
    }
  });

  $('#btn-carrinho').addEventListener('click', abrirCarrinho);

  $('#ordem').addEventListener('change', (e) => {
    estado.ordem = e.target.value;
    atualizarVitrine();
  });

  // Busca com "debounce": espera a pessoa parar de digitar (180ms) antes de
  // reanimar a grade — senão cada tecla dispararia uma animação.
  let espera;
  $('#busca').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      estado.busca = e.target.value;
      atualizarVitrine();
    }, 180);
  });

  // Atalho "/" foca a busca (padrão de GitHub, YouTube...).
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || Dialogo.aberto || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    e.preventDefault();
    $('#busca').focus();
  });

  $('#limpar-filtros').addEventListener('click', () => {
    estado.busca = '';
    estado.categoria = 'todos';
    $('#busca').value = '';
    $$('#filtros .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.categoria === 'todos')));
    atualizarVitrine();
    $('#filtros .chip').focus();
  });

  $('#copiar-cupom').addEventListener('click', async () => {
    const ok = await copiarTexto('PIXEL10');
    Toast.mostrar(ok ? 'Cupom PIXEL10 copiado! Use no carrinho.' : 'Use o cupom PIXEL10 no carrinho.', { tipo: 'info' });
  });

  // Ferramentas do modal
  $('#mp-grade').addEventListener('click', (e) => {
    const ligado = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(ligado));
    $('#mp-tela').classList.toggle('com-grade', ligado);
  });
  $('#mp-play').addEventListener('click', () => {
    if (Movimento.reduzido) return Toast.mostrar('Animações desativadas pela preferência de movimento reduzido do sistema.', { tipo: 'info' });
    Animador.pausar(modal.canvas, !Animador.estado(modal.canvas).pausado);
    atualizarPlay();
  });

  // Entrada do herói: elementos sobem em sequência (stagger de 70ms).
  $$('.hero__texto > *, .hero__cena').forEach((el, i) => {
    Movimento.animar(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 60 + i * 70, easing: EASE_SAIDA, fill: 'backwards' });
  });

  // Cards entram em cascata conforme aparecem na rolagem (uma vez só).
  if (!Movimento.reduzido && 'IntersectionObserver' in window) {
    const revelar = new IntersectionObserver(
      (entradas) => {
        entradas
          .filter((en) => en.isIntersecting)
          .forEach((en, i) => {
            revelar.unobserve(en.target);
            Movimento.animar(en.target, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: i * 60, easing: EASE_SAIDA, fill: 'backwards' });
          });
      },
      { rootMargin: '0px 0px -40px 0px' }
    );
    $$('.card, .beneficios li').forEach((el) => revelar.observe(el));
  }
}

iniciar();
