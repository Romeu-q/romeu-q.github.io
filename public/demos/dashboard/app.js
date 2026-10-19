/* ==========================================================================
   app.js — "cola" da aplicação
   --------------------------------------------------------------------------
   Guarda o estado (período e métrica do gráfico) e, a cada mudança, manda os
   módulos se redesenharem. Fluxo em uma direção só:
       estado → Dados.analisar() → KPIs / Gráficos / Ranking / Calor / Tabela
   Nenhum módulo conversa com outro "por fora": tudo passa por aqui.
   ========================================================================== */
(function () {
  'use strict';

  const { h, icone } = UI;

  const estado = { periodo: '30', metrica: 'faturamento' };
  const NOMES_PERIODO = { 7: 'Últimos 7 dias', 30: 'Últimos 30 dias', '12m': 'Últimos 12 meses' };

  // Cache: trocar 30d → 7d → 30d não recalcula o que já foi calculado.
  const cache = new Map();
  function analise(chave = estado.periodo) {
    if (!cache.has(chave)) cache.set(chave, Dados.analisar(chave));
    return cache.get(chave);
  }

  const el = {
    bento: document.getElementById('bento'),
    kpis: [...document.querySelectorAll('[data-kpi]')],
    intervalo: document.getElementById('intervalo-texto'),
    receitaTotal: document.getElementById('receita-total'),
    receitaSelo: document.getElementById('receita-selo'),
    ranking: document.getElementById('ranking'),
    calor: document.getElementById('calor'),
    calorResumo: document.getElementById('calor-resumo'),
    dicaCalor: document.getElementById('dica-calor'),
    feed: document.getElementById('feed'),
    anuncio: document.getElementById('anuncio'),
    navContador: document.getElementById('nav-contador'),
  };

  // Elementos que viram "esqueleto" enquanto os dados do período carregam.
  document.querySelectorAll('.kpi__valor, .kpi__nota, .bloco__destaque, .grafico--receita, .rosca__grafico, .ranking, .calor, #pedidos-resumo')
    .forEach((n) => n.classList.add('esq'));

  /* ---------- KPIs ---------- */
  const FORMATO_KPI = {
    faturamento: (v) => Formato.moedaInteira.format(v),
    pedidos: (v) => Formato.inteiro.format(Math.round(v)),
    ticket: (v) => Formato.moeda.format(v),
    novos: (v) => Formato.inteiro.format(Math.round(v)),
  };

  function desenharKpis(a) {
    el.kpis.forEach((card) => {
      const k = card.dataset.kpi;
      UI.contar(card.querySelector('[data-valor]'), a.atual[k], FORMATO_KPI[k]);
      UI.preencherSelo(card.querySelector('[data-selo]'), a.variacoes[k]);
      // No celular o cartão é estreito: a parte longa some visualmente, mas o
      // leitor de tela continua lendo a frase inteira (classe só esconde no CSS).
      card.querySelector('[data-nota]').replaceChildren(
        `vs. ${FORMATO_KPI[k](a.anterior[k])}`,
        h('span', { class: 'kpi__nota-longa', text: ' no período anterior' }));
      // Sparkline do ticket por dia oscila demais em 7d; a forma geral basta.
      UI.faisca(card.querySelector('[data-faisca]'), a.atual.serie[k]);
    });
  }

  function desenharDestaqueReceita(a) {
    const k = estado.metrica;
    UI.contar(el.receitaTotal, a.atual[k], FORMATO_KPI[k]);
    UI.preencherSelo(el.receitaSelo, a.variacoes[k]);
  }

  // Uma frase de insight embaixo da rosca: qual categoria mais cresceu.
  function desenharDestaqueCategoria(a) {
    const anterior = Object.fromEntries(a.categoriasAnteriores.map((c) => [c.id, c.total]));
    const melhor = a.categorias
      .map((c) => ({ ...c, v: anterior[c.id] ? (c.total - anterior[c.id]) / anterior[c.id] : 0 }))
      .sort((x, y) => y.v - x.v)[0];
    const alvo = document.getElementById('cat-destaque');
    const selo = h('span', { class: 'selo' });
    UI.preencherSelo(selo, melhor.v);
    alvo.replaceChildren(h('span', { text: 'Maior alta: ' }), h('strong', { text: melhor.nome }), selo);
  }

  /* ---------- Ranking de produtos ---------- */
  function desenharRanking(a) {
    const max = a.produtos[0]?.receita || 1;
    const nomeCategoria = Object.fromEntries(Dados.CATEGORIAS.map((c) => [c.id, c.nome]));
    el.ranking.replaceChildren(...a.produtos.map((p, i) => {
      const barra = h('span');
      const li = h('li', {},
        h('span', { class: 'ranking__pos', 'aria-hidden': 'true', text: String(i + 1) }),
        h('span', { class: 'ranking__nome', text: p.produto.nome }),
        h('span', { class: 'ranking__valor', text: Formato.moedaInteira.format(p.receita) }),
        h('span', { class: 'ranking__barra', 'aria-hidden': 'true' }, barra),
        h('span', { class: 'ranking__meta', text: `${Formato.inteiro.format(p.unidades)} un.` }),
        h('span', { class: 'so-leitor', text: `, ${nomeCategoria[p.produto.categoria]}, ${Formato.inteiro.format(p.unidades)} unidades vendidas` }));
      // A barra começa vazia e cresce no próximo frame (transição de transform).
      requestAnimationFrame(() => requestAnimationFrame(() => barra.style.setProperty('--p', (p.receita / max).toFixed(3))));
      return li;
    }));
  }

  /* ---------- Mapa de calor ---------- */
  const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const DIAS_LONGOS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  const faixa = (c) => `${c * 2}h–${c * 2 + 2}h`;
  const celulas = [];

  // A grade é montada uma vez; depois só muda a intensidade (--v) de cada célula.
  function montarCalor() {
    const frag = document.createDocumentFragment();
    DIAS.forEach((dia, l) => {
      frag.append(h('span', { class: 'calor__rot', text: dia }));
      for (let c = 0; c < 12; c++) {
        const cel = h('span', { class: 'calor__celula', 'data-l': l, 'data-c': c });
        celulas.push(cel);
        frag.append(cel);
      }
    });
    frag.append(h('span'));
    for (let c = 0; c < 12; c++) frag.append(h('span', { class: 'calor__rot calor__rot--col', text: c % 2 === 0 ? `${c * 2}h` : '' }));
    el.calor.append(frag);

    const bloco = el.calor.closest('.bloco');
    el.calor.addEventListener('mouseover', (e) => {
      const cel = e.target.closest('.calor__celula');
      if (!cel) return;
      const l = +cel.dataset.l, c = +cel.dataset.c;
      el.dicaCalor.textContent = `${DIAS[l]} · ${faixa(c)} — ${Formato.inteiro.format(analise().calor[l][c])} pedidos`;
      const rb = bloco.getBoundingClientRect(), rc = cel.getBoundingClientRect();
      const x = Math.min(Math.max(8, rc.left - rb.left + rc.width / 2 - el.dicaCalor.offsetWidth / 2), rb.width - el.dicaCalor.offsetWidth - 8);
      el.dicaCalor.style.setProperty('--dx', `${x}px`);
      el.dicaCalor.style.setProperty('--dy', `${rc.top - rb.top - el.dicaCalor.offsetHeight - 8}px`);
      el.dicaCalor.classList.add('visivel');
    });
    el.calor.addEventListener('mouseleave', () => el.dicaCalor.classList.remove('visivel'));
  }

  function desenharCalor(a) {
    const max = Math.max(1, ...a.calor.flat());
    let pico = [0, 0];
    a.calor.forEach((linha, l) => linha.forEach((v, c) => { if (v > a.calor[pico[0]][pico[1]]) pico = [l, c]; }));
    celulas.forEach((cel) => {
      const v = a.calor[cel.dataset.l][cel.dataset.c];
      // Raiz quadrada: realça diferenças nos horários fracos (senão quase tudo fica apagado).
      cel.style.setProperty('--v', Math.sqrt(v / max).toFixed(3));
    });
    const [pl, pc] = pico;
    const texto = `Pico: ${DIAS_LONGOS[pl]}, ${faixa(pc)} (${Formato.inteiro.format(a.calor[pl][pc])} pedidos)`;
    el.calorResumo.textContent = texto;
    el.calor.setAttribute('aria-label', `Mapa de calor de pedidos por dia da semana e faixa de 2 horas. ${texto}. Movimento concentrado no almoço e entre 18h e 22h.`);
  }

  /* ---------- Atividade recente ---------- */
  function desenharFeed() {
    const ICONES = { pedido: 'bag', cliente: 'user-plus', rota: 'truck', entregue: 'check', cancelado: 'ban' };
    el.feed.replaceChildren(...Dados.atividadeRecente(5).map(({ tipo, pedido: p, minutosAtras }) => {
      const quando = Formato.relativo(minutosAtras);
      const titulo = {
        pedido: [h('strong', { text: `Novo pedido #${p.numero}` }), ` de ${p.cliente.nome}`],
        cliente: [h('strong', { text: 'Novo cliente' }), ` · ${p.cliente.nome} fez a 1ª compra`],
        rota: [h('strong', { text: `#${p.numero} saiu para entrega` })],
        entregue: [h('strong', { text: `#${p.numero} entregue` })],
        cancelado: [h('strong', { text: `#${p.numero} cancelado` })],
      }[tipo];
      const meta = tipo === 'pedido' || tipo === 'cliente'
        ? `${Formato.moeda.format(p.total)} · ${quando}`
        : `${p.cliente.nome} · ${quando}`;
      return h('li', {},
        h('span', { class: `feed__icone feed__icone--${tipo}`, 'aria-hidden': 'true' }, icone(ICONES[tipo])),
        h('p', { class: 'feed__texto' }, titulo, h('span', { class: 'feed__meta', text: meta })));
    }));
  }

  /* ---------- Render principal ---------- */
  function descreverIntervalo(periodo) {
    const de = Dados.dataDoDia(periodo.inicio);
    const ate = Dados.dataDoDia(periodo.fim);
    return `${Formato.diaMes(de)} ${de.getFullYear() !== ate.getFullYear() ? de.getFullYear() + ' ' : ''}– ${Formato.diaMes(ate)} ${ate.getFullYear()}`;
  }

  function renderizar(animarTabela) {
    const a = analise();
    el.intervalo.textContent = `${NOMES_PERIODO[estado.periodo]} · ${descreverIntervalo(a.periodo)}`;
    el.navContador.textContent = Formato.inteiro.format(a.pedidos.length);
    desenharKpis(a);
    desenharDestaqueReceita(a);
    Graficos.atualizarReceita(a, estado.metrica);
    Graficos.atualizarCategorias(a.categorias);
    desenharDestaqueCategoria(a);
    desenharRanking(a);
    desenharCalor(a);
    Tabela.definirPedidos(a.pedidos, animarTabela);
  }

  // Troca de período com "carregamento" falso: num produto real aqui haveria
  // um fetch. O esqueleto mostra que algo está acontecendo, e o token evita
  // que cliques rápidos (7d → 12m → 30d) desenhem um período velho por último.
  let token = 0;
  async function trocarPeriodo(chave) {
    if (chave === estado.periodo) return;
    estado.periodo = chave;
    periodo.selecionar(chave, false);
    const meu = ++token;
    el.bento.classList.add('carregando');
    el.bento.setAttribute('aria-busy', 'true');
    await UI.esperar(420);
    if (meu !== token) return;
    el.bento.classList.remove('carregando');
    el.bento.removeAttribute('aria-busy');
    renderizar(true);
    const a = analise();
    el.anuncio.textContent = `${NOMES_PERIODO[chave]}: receita de ${Formato.moedaInteira.format(a.atual.faturamento)}, ${Formato.percentual.format(a.variacoes.faturamento)} em relação ao período anterior.`;
  }

  /* ---------- Exportar CSV ---------- */
  function exportar() {
    const { texto, quantidade } = Tabela.csv();
    if (!quantidade) {
      UI.toast('Nada para exportar', 'Nenhum pedido com os filtros atuais.', 'x');
      return;
    }
    const nome = `pedidos-sabia-${estado.periodo}-${Dados.AGORA.toISOString().slice(0, 10)}.csv`;
    UI.baixar(nome, texto, 'text/csv;charset=utf-8');
    const filtro = Tabela.descricaoFiltro();
    UI.toast('Relatório exportado', `${Formato.inteiro.format(quantidade)} pedidos${filtro ? ` (${filtro})` : ''} · ${nome}`, 'download');
  }
  document.querySelectorAll('[data-acao="exportar"]').forEach((b) => b.addEventListener('click', exportar));

  /* ---------- Controles ---------- */
  const periodo = UI.segmentado(document.getElementById('periodo'), (b) => trocarPeriodo(b.dataset.periodo));
  UI.segmentado(document.getElementById('metrica'), (b) => {
    estado.metrica = b.dataset.metrica;
    document.getElementById('t-receita').textContent = estado.metrica === 'faturamento' ? 'Receita no período' : 'Pedidos no período';
    desenharDestaqueReceita(analise());
    Graficos.atualizarReceita(analise(), estado.metrica);
  });

  /* ---------- Comandos da paleta ---------- */
  const secao = (id, titulo, ic, palavras) => ({ grupo: 'Navegar', titulo, icone: ic, palavras, executar: () => UI.irPara(id) });
  const comandoPeriodo = (chave, titulo) => ({
    grupo: 'Período', titulo, icone: 'calendar', palavras: `periodo ${chave}`,
    extra: () => (estado.periodo === chave ? 'atual' : ''),
    executar: () => trocarPeriodo(chave),
  });
  Paleta.registrar([
    secao('visao', 'Visão geral', 'grid', 'inicio kpi resumo'),
    secao('receita', 'Receita', 'trend', 'faturamento grafico vendas'),
    secao('categorias', 'Categorias', 'pie', 'rosca'),
    secao('produtos', 'Produtos mais vendidos', 'package', 'ranking top'),
    secao('horarios', 'Horários de pico', 'clock', 'mapa calor'),
    secao('atividade', 'Atividade recente', 'activity', 'feed tempo real'),
    secao('pedidos', 'Pedidos', 'bag', 'tabela'),
    comandoPeriodo('7', 'Últimos 7 dias'),
    comandoPeriodo('30', 'Últimos 30 dias'),
    comandoPeriodo('12m', 'Últimos 12 meses'),
    {
      grupo: 'Ações', titulo: 'Alternar tema claro/escuro', icone: 'moon', palavras: 'tema dark light modo escuro claro',
      extra: () => (UI.temaAtual() === 'dark' ? 'escuro' : 'claro'), executar: UI.alternarTema,
    },
    { grupo: 'Ações', titulo: 'Exportar pedidos (CSV)', icone: 'download', palavras: 'baixar relatorio planilha excel', executar: exportar },
    {
      grupo: 'Ações', titulo: 'Ver pedidos cancelados', icone: 'ban', palavras: 'filtro status',
      executar: () => { Tabela.filtrarStatus('Cancelado'); UI.irPara('pedidos'); },
    },
    {
      grupo: 'Ações', titulo: 'Recolher/expandir menu lateral', icone: 'panel', palavras: 'sidebar',
      executar: () => UI.recolherMenu(document.documentElement.getAttribute('data-menu') !== 'recolhido'),
    },
  ]);

  /* ---------- Início ----------
     Entrada escalonada dos cards + esqueleto curto, como se os dados
     viessem da rede. Com movimento reduzido, aparece tudo de uma vez. */
  async function iniciar() {
    montarCalor();
    desenharFeed();
    el.bento.classList.add('carregando');
    document.body.classList.add('entrando');
    await UI.esperar(650);
    el.bento.classList.remove('carregando');
    renderizar(false);
    setTimeout(() => document.body.classList.remove('entrando'), 1200);
  }
  iniciar();
})();
