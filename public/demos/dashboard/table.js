/* ==========================================================================
   table.js — tabela de pedidos: busca, filtro por status, ordenação,
   paginação e exportação CSV
   --------------------------------------------------------------------------
   Fluxo: pedidos do período → filtro (status + busca) → ordenação → página.
   Cada etapa é uma função pura sobre arrays; render() só desenha o resultado.
   O CSV usa exatamente as linhas filtradas (todas as páginas), então o que a
   pessoa vê é o que ela baixa.
   ========================================================================== */
(function () {
  'use strict';

  const { h, icone } = UI;
  const POR_PAGINA = 8;

  const COLUNAS = [
    { chave: 'numero',  rotulo: 'Pedido',  valor: (p) => p.numero },
    { chave: 'cliente', rotulo: 'Cliente', valor: (p) => p.cliente.nome },
    { chave: 'data',    rotulo: 'Data',    valor: (p) => p.data.getTime() },
    { chave: 'canal',   rotulo: 'Canal',   valor: (p) => p.canal },
    { chave: 'status',  rotulo: 'Status',  valor: (p) => ORDEM_STATUS.indexOf(p.status) },
    { chave: 'total',   rotulo: 'Total',   valor: (p) => p.total, alinhar: 'direita' },
  ];
  const ORDEM_STATUS = ['Preparando', 'Em rota', 'Entregue', 'Cancelado'];
  const STATUS = {
    'Preparando': { classe: 'preparando', icone: 'clock' },
    'Em rota':    { classe: 'rota',       icone: 'truck' },
    'Entregue':   { classe: 'entregue',   icone: 'check' },
    'Cancelado':  { classe: 'cancelado',  icone: 'ban' },
  };

  const estado = {
    pedidos: [],
    busca: '',
    status: 'todos',
    ordem: { chave: 'data', direcao: 'desc' },
    pagina: 1,
  };

  const el = {
    tabela: document.getElementById('tabela'),
    cab: document.getElementById('tabela-cab'),
    corpo: document.getElementById('tabela-corpo'),
    vazio: document.getElementById('tabela-vazia'),
    busca: document.getElementById('busca-pedidos'),
    chips: document.getElementById('chips'),
    resumo: document.getElementById('pedidos-resumo'),
    pagResumo: document.getElementById('paginacao-resumo'),
    pagBotoes: document.getElementById('paginacao-botoes'),
    limpar: document.getElementById('limpar-filtros'),
  };

  /* ---------- Busca sem acento e sem maiúscula ----------
     "joao" acha "João": NFD separa a letra do acento e o regex remove o acento. */
  const normalizar = (texto) => String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Texto pesquisável de cada pedido, calculado uma vez (não a cada tecla).
  const indiceBusca = new WeakMap();
  function textoDe(p) {
    if (!indiceBusca.has(p)) {
      indiceBusca.set(p, normalizar(`#${p.numero} ${p.numero} ${p.cliente.nome} ${p.cliente.cidade} ${p.canal} ${p.status} ${p.pagamento}`));
    }
    return indiceBusca.get(p);
  }

  /* ---------- Pipeline ---------- */
  function filtrarPorBusca(lista) {
    // Cada palavra precisa aparecer (busca "ana sp" acha Ana de São Paulo... se a cidade tiver "sp").
    const termos = normalizar(estado.busca).split(/\s+/).filter(Boolean);
    if (!termos.length) return lista;
    return lista.filter((p) => { const t = textoDe(p); return termos.every((termo) => t.includes(termo)); });
  }
  const filtrarPorStatus = (lista) => (estado.status === 'todos' ? lista : lista.filter((p) => p.status === estado.status));

  function ordenar(lista) {
    const coluna = COLUNAS.find((c) => c.chave === estado.ordem.chave);
    const sinal = estado.ordem.direcao === 'asc' ? 1 : -1;
    const comparar = new Intl.Collator('pt-BR').compare; // ordena "Á" junto com "A"
    // Copio antes de ordenar: sort() muda o array original.
    return [...lista].sort((a, b) => {
      const va = coluna.valor(a), vb = coluna.valor(b);
      const r = typeof va === 'string' ? comparar(va, vb) : va - vb;
      return r * sinal || b.numero - a.numero; // desempate estável: mais recente primeiro
    });
  }

  function resultado() {
    const buscados = filtrarPorBusca(estado.pedidos);
    return { buscados, linhas: ordenar(filtrarPorStatus(buscados)) };
  }

  /* ---------- Desenho ---------- */
  const CORES_AVATAR = ['#7c6cff', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444'];
  const iniciais = (nome) => nome.split(' ').map((n) => n[0]).slice(0, 2).join('');

  // Realça o trecho buscado no nome (sem innerHTML: monto nós de texto).
  function realcar(texto) {
    const termo = normalizar(estado.busca.trim().split(/\s+/)[0] || '');
    if (!termo) return [texto];
    const i = normalizar(texto).indexOf(termo);
    if (i < 0) return [texto];
    return [texto.slice(0, i), h('mark', { class: 'marca-busca', text: texto.slice(i, i + termo.length) }), texto.slice(i + termo.length)];
  }

  function desenharCabecalho() {
    el.cab.replaceChildren(...COLUNAS.map((c) => {
      const ativa = estado.ordem.chave === c.chave;
      const th = h('th', {
        scope: 'col',
        'data-alinhar': c.alinhar,
        // aria-sort só na coluna ordenada: o leitor anuncia "ordenado crescente".
        'aria-sort': ativa ? (estado.ordem.direcao === 'asc' ? 'ascending' : 'descending') : null,
      });
      const botao = h('button', { type: 'button' }, c.rotulo, icone('up', 'icone seta-ordem'));
      botao.addEventListener('click', () => {
        // Mesma coluna inverte; coluna nova começa decrescente em números/datas.
        if (estado.ordem.chave === c.chave) estado.ordem.direcao = estado.ordem.direcao === 'asc' ? 'desc' : 'asc';
        else estado.ordem = { chave: c.chave, direcao: ['cliente', 'canal', 'status'].includes(c.chave) ? 'asc' : 'desc' };
        estado.pagina = 1;
        render(true);
        sincronizarSelect();
        // Redesenhar o cabeçalho recria o botão: devolvo o foco para quem usa teclado.
        el.cab.querySelectorAll('button')[COLUNAS.indexOf(c)].focus();
      });
      th.append(botao);
      return th;
    }));
  }

  function linha(p) {
    const st = STATUS[p.status];
    const dataTxt = `${Formato.data(p.data).slice(0, 5)} · ${Formato.hora(p.data)}`;
    return h('tr', {},
      h('td', { 'data-col': 'numero', class: 'cel-pedido', 'data-extra': `${dataTxt} · ${p.canal}` }, h('span', { text: `#${p.numero}` })),
      h('td', { 'data-col': 'cliente' },
        h('div', { class: 'cliente' },
          h('span', { class: 'cliente__avatar', style: `--c:${CORES_AVATAR[p.cliente.id % CORES_AVATAR.length]}`, 'aria-hidden': 'true', text: iniciais(p.cliente.nome) }),
          h('span', {}, h('span', { class: 'cliente__nome' }, realcar(p.cliente.nome)), h('span', { class: 'cliente__cidade', text: p.cliente.cidade })))),
      h('td', { 'data-col': 'data', class: 'cel-data' },
        h('span', {}, Formato.data(p.data), h('small', { text: Formato.hora(p.data) }))),
      h('td', { 'data-col': 'canal' }, h('span', { text: p.canal })),
      h('td', { 'data-col': 'status' }, h('span', { class: `status status--${st.classe}` }, icone(st.icone), p.status)),
      h('td', { 'data-col': 'total', 'data-alinhar': 'direita', class: 'cel-total' }, h('span', { text: Formato.moeda.format(p.total) })),
    );
  }

  function desenharChips(buscados) {
    const contagem = { todos: buscados.length };
    buscados.forEach((p) => { contagem[p.status] = (contagem[p.status] || 0) + 1; });
    const opcoes = [['todos', 'Todos'], ...ORDEM_STATUS.map((s) => [s, s])];
    el.chips.replaceChildren(...opcoes.map(([valor, rotulo]) => {
      const chip = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(estado.status === valor) },
        rotulo, h('span', { class: 'chip__qtd', text: Formato.inteiro.format(contagem[valor] || 0) }));
      chip.addEventListener('click', () => {
        estado.status = valor;
        estado.pagina = 1;
        render(true);
        el.chips.querySelectorAll('.chip')[opcoes.findIndex((o) => o[0] === valor)].focus();
      });
      return chip;
    }));
  }

  // Números de página com reticências: 1 … 4 5 6 … 20
  function paginasVisiveis(atual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, atual, atual - 1, atual + 1]);
    if (atual <= 3) [2, 3, 4].forEach((n) => set.add(n));
    if (atual >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
    const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
    const saida = [];
    nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) saida.push('…'); saida.push(n); });
    return saida;
  }

  function desenharPaginacao(total) {
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    const de = total ? (estado.pagina - 1) * POR_PAGINA + 1 : 0;
    const ate = Math.min(total, estado.pagina * POR_PAGINA);
    el.pagResumo.textContent = `${Formato.inteiro.format(de)}–${Formato.inteiro.format(ate)} de ${Formato.inteiro.format(total)}`;

    const irPara = (n, focar) => {
      estado.pagina = n;
      render(true);
      // Mantém o foco num botão equivalente (o antigo foi recriado).
      el.pagBotoes.querySelector(focar)?.focus();
    };
    const anterior = h('button', { type: 'button', class: 'pag-btn', 'aria-label': 'Página anterior', disabled: estado.pagina === 1 }, icone('left'));
    anterior.addEventListener('click', () => irPara(estado.pagina - 1, '[data-pag="ant"]'));
    anterior.dataset.pag = 'ant';
    const proxima = h('button', { type: 'button', class: 'pag-btn', 'aria-label': 'Próxima página', disabled: estado.pagina === paginas }, icone('right'));
    proxima.addEventListener('click', () => irPara(estado.pagina + 1, '[data-pag="prox"]'));
    proxima.dataset.pag = 'prox';

    const numeros = paginasVisiveis(estado.pagina, paginas).map((n) => {
      if (n === '…') return h('span', { class: 'pag-reticencias', 'aria-hidden': 'true', text: '…' });
      const b = h('button', {
        type: 'button', class: 'pag-btn', 'data-pag': n, 'aria-label': `Página ${n}`,
        'aria-current': n === estado.pagina ? 'page' : null, text: String(n),
      });
      b.addEventListener('click', () => irPara(n, `[data-pag="${n}"]`));
      return b;
    });
    el.pagBotoes.replaceChildren(anterior, ...numeros, proxima);
  }

  function render(animar = false) {
    const { buscados, linhas } = resultado();
    const paginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
    estado.pagina = Math.min(estado.pagina, paginas);
    const inicio = (estado.pagina - 1) * POR_PAGINA;

    desenharCabecalho();
    desenharChips(buscados);
    el.corpo.replaceChildren(...linhas.slice(inicio, inicio + POR_PAGINA).map(linha));
    el.vazio.hidden = linhas.length > 0;
    el.tabela.hidden = linhas.length === 0;
    desenharPaginacao(linhas.length);
    el.resumo.textContent = `${Formato.inteiro.format(estado.pedidos.length)} pedidos no período`;

    if (animar) {
      el.tabela.classList.remove('atualizou');
      void el.tabela.offsetWidth; // reinicia a animação das linhas
      el.tabela.classList.add('atualizou');
    }
  }

  /* ---------- Ordenação no celular ----------
     No celular o cabeçalho some (linhas viram cartões), então um <select>
     faz o papel dos botões de ordenar. */
  const OPCOES_ORDEM = [
    ['data:desc', 'Mais recentes'], ['data:asc', 'Mais antigos'],
    ['total:desc', 'Maior valor'], ['total:asc', 'Menor valor'], ['cliente:asc', 'Cliente (A–Z)'],
  ];
  const select = h('select', { class: 'ordenar-movel', 'aria-label': 'Ordenar pedidos' },
    OPCOES_ORDEM.map(([v, r]) => h('option', { value: v, text: r })));
  function sincronizarSelect() {
    const v = `${estado.ordem.chave}:${estado.ordem.direcao}`;
    if (OPCOES_ORDEM.some((o) => o[0] === v)) select.value = v;
  }
  select.addEventListener('change', () => {
    const [chave, direcao] = select.value.split(':');
    estado.ordem = { chave, direcao };
    estado.pagina = 1;
    render(true);
  });
  el.busca.parentElement.after(select);

  /* ---------- Eventos ---------- */
  // Debounce: espera a pessoa parar de digitar ~200 ms antes de filtrar.
  const aoBuscar = UI.debounce(() => {
    estado.busca = el.busca.value;
    estado.pagina = 1;
    render(true);
  }, 200);
  el.busca.addEventListener('input', aoBuscar);
  el.busca.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.busca.value) { e.stopPropagation(); el.busca.value = ''; aoBuscar(); }
  });
  el.limpar.addEventListener('click', () => {
    el.busca.value = '';
    estado.busca = '';
    estado.status = 'todos';
    estado.pagina = 1;
    render(true);
    el.busca.focus();
  });

  /* ---------- CSV ---------- */
  function csv() {
    const { linhas } = resultado();
    // Ponto e vírgula + BOM UTF-8: é o que o Excel em português abre certo (acentos e colunas).
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const cab = ['Pedido', 'Data', 'Hora', 'Cliente', 'Cidade', 'Canal', 'Pagamento', 'Status', 'Itens', 'Total (R$)'];
    const corpo = linhas.map((p) => [
      p.numero, Formato.data(p.data), Formato.hora(p.data), p.cliente.nome, p.cliente.cidade, p.canal, p.pagamento, p.status,
      p.itens.map((it) => `${it.qtd}x ${it.produto.nome}`).join(' | '),
      p.total.toFixed(2).replace('.', ','),
    ].map(esc).join(';'));
    return { texto: '﻿' + [cab.map(esc).join(';'), ...corpo].join('\r\n'), quantidade: linhas.length };
  }

  globalThis.Tabela = {
    definirPedidos(lista, animar) {
      estado.pedidos = lista;
      estado.pagina = 1;
      render(animar);
    },
    buscar(texto) {
      el.busca.value = texto;
      estado.busca = texto;
      estado.status = 'todos';
      estado.pagina = 1;
      render(true);
    },
    filtrarStatus(status) { estado.status = status; estado.pagina = 1; render(true); },
    csv,
    descricaoFiltro() {
      const partes = [];
      if (estado.status !== 'todos') partes.push(estado.status.toLowerCase());
      if (estado.busca.trim()) partes.push(`busca "${estado.busca.trim()}"`);
      return partes.join(', ');
    },
  };
})();
