/* ==========================================================================
   charts.js — gráficos com Chart.js (área de receita + rosca de categorias)
   --------------------------------------------------------------------------
   Os gráficos são criados UMA vez. Ao trocar período/métrica só troco os
   dados e chamo update(): o Chart.js anima a transição dos pontos sozinho,
   e não há vazamento de memória de recriar canvas a cada clique.
   As cores vêm das variáveis CSS do tema, então claro/escuro é uma fonte só.
   ========================================================================== */
(function () {
  'use strict';

  const { h, semMovimento, consultaMovimento } = UI;
  const css = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

  // Paleta das categorias: 6 cores distintas em matiz E luminosidade (ajuda
  // daltônicos) e a legenda sempre mostra nome + % em texto.
  const PALETA = {
    dark: ['#7c6cff', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#94a3b8'],
    light: ['#5b4fe8', '#0891b2', '#059669', '#d97706', '#db2777', '#64748b'],
  };
  const corDasCategorias = () => PALETA[UI.temaAtual()] || PALETA.dark;

  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.animation = semMovimento() ? false : { duration: 650, easing: 'easeOutQuart' };
  consultaMovimento.addEventListener('change', () => {
    Chart.defaults.animation = semMovimento() ? false : { duration: 650, easing: 'easeOutQuart' };
  });

  /* ---------- Plugin: linha vertical (crosshair) no ponto em foco ---------- */
  const linhaGuia = {
    id: 'linhaGuia',
    afterDatasetsDraw(chart) {
      const ativo = chart.tooltip?.getActiveElements?.()[0];
      if (!ativo) return;
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.strokeStyle = css('--borda-forte');
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ativo.element.x, chartArea.top);
      ctx.lineTo(ativo.element.x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    },
  };

  /* ---------- Gráfico de receita ---------- */
  let receita = null;
  let contextoReceita = null; // { rotulosLongos, formatar, anteriorTotal... } para a dica

  // Gradiente vertical no preenchimento: forte em cima, some embaixo.
  // Scriptable: recalculado quando o tamanho do gráfico muda.
  function preenchimento(contexto) {
    const { ctx, chartArea } = contexto.chart;
    if (!chartArea) return 'transparent';
    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    const cor = css('--acento');
    g.addColorStop(0, hexComAlfa(cor, UI.temaAtual() === 'dark' ? 0.34 : 0.22));
    g.addColorStop(0.6, hexComAlfa(cor, 0.06));
    g.addColorStop(1, hexComAlfa(cor, 0));
    return g;
  }
  function hexComAlfa(hex, alfa) {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
  }

  // Dica em HTML (plugin "external" do Chart.js): mesma fonte e tema da página.
  const dica = document.getElementById('dica-receita');
  function dicaExterna({ chart, tooltip }) {
    if (tooltip.opacity === 0 || !tooltip.dataPoints?.length) { dica.classList.remove('visivel'); return; }
    const i = tooltip.dataPoints[0].dataIndex;
    const atual = chart.data.datasets[0].data[i];
    const anterior = chart.data.datasets[1].data[i];
    const { formatar, rotulosLongos } = contextoReceita;

    const selo = h('span', { class: 'selo' });
    UI.preencherSelo(selo, anterior ? (atual - anterior) / anterior : null);
    dica.replaceChildren(
      h('p', { class: 'dica__titulo', text: rotulosLongos[i] }),
      h('p', { class: 'dica__linha' }, h('span', { class: 'dica__cor' }), 'Atual', h('strong', { text: formatar(atual) })),
      h('p', { class: 'dica__linha' }, h('span', { class: 'dica__cor dica__cor--anterior' }), 'Anterior', h('strong', { text: formatar(anterior) })),
      selo,
    );
    // Posiciona à direita do ponto; perto da borda direita, vira para a esquerda.
    const largura = dica.offsetWidth;
    const esquerda = tooltip.caretX + 14 + largura > chart.width ? tooltip.caretX - largura - 14 : tooltip.caretX + 14;
    dica.style.setProperty('--dx', `${Math.max(0, esquerda)}px`);
    dica.style.setProperty('--dy', `${Math.max(0, Math.min(tooltip.caretY - 40, chart.height - dica.offsetHeight))}px`);
    dica.classList.add('visivel');
  }

  function criarReceita() {
    const canvas = document.getElementById('grafico-receita');
    receita = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Atual', data: [], fill: 'origin', tension: 0.38, borderWidth: 2,
            pointRadius: 0, pointHoverRadius: 5, pointHoverBorderWidth: 2.5,
          },
          {
            label: 'Período anterior', data: [], fill: false, tension: 0.38, borderWidth: 1.6,
            borderDash: [5, 5], pointRadius: 0, pointHoverRadius: 4, pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        // O preenchimento é um CanvasGradient: o Chart.js não sabe interpolar
        // gradiente entre dois estados, então desligo a animação de cores.
        animations: { colors: false },
        layout: { padding: { top: 6, right: 4 } },
        plugins: {
          legend: { display: false }, // legenda própria em HTML (acessível e estilizável)
          tooltip: { enabled: false, external: dicaExterna },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { maxRotation: 0, autoSkipPadding: 18, padding: 8 },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { drawTicks: false },
            ticks: { padding: 10, maxTicksLimit: 5 },
          },
        },
      },
      plugins: [linhaGuia],
    });
    canvas.addEventListener('mouseleave', () => dica.classList.remove('visivel'));
    aplicarTemaReceita();
  }

  function aplicarTemaReceita() {
    const [atual, anterior] = receita.data.datasets;
    const acento = css('--acento');
    atual.borderColor = acento;
    atual.backgroundColor = preenchimento;
    atual.pointHoverBackgroundColor = css('--superficie');
    atual.pointHoverBorderColor = acento;
    atual.pointBackgroundColor = css('--superficie');
    atual.pointBorderColor = acento;
    anterior.borderColor = css('--texto-3');
    anterior.pointHoverBackgroundColor = css('--superficie');
    anterior.pointHoverBorderColor = css('--texto-3');
    receita.options.scales.x.ticks.color = css('--texto-3');
    receita.options.scales.y.ticks.color = css('--texto-3');
    receita.options.scales.y.grid.color = css('--borda');
  }

  /* metrica: 'faturamento' | 'pedidos'. analise vem de Dados.analisar(). */
  function atualizarReceita(analise, metrica) {
    if (!receita) criarReceita();
    const { baldes, atual, anterior, periodo } = analise;
    const porMes = periodo.granularidade === 'mes';
    const formatar = metrica === 'faturamento' ? (v) => Formato.moeda.format(v) : (v) => `${Formato.inteiro.format(v)} pedidos`;
    contextoReceita = {
      formatar,
      // O mês atual ainda não acabou: aviso na dica para a queda no fim da curva não assustar.
      rotulosLongos: baldes.rotulos.map((d, i) => (porMes
        ? d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) + (i === baldes.rotulos.length - 1 ? ` (até dia ${Dados.AGORA.getDate()})` : '')
        : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }))),
    };
    receita.data.labels = baldes.rotulos.map((d) => (porMes ? Formato.mesAno(d) : Formato.diaMes(d)));
    receita.data.datasets[0].data = atual.serie[metrica];
    receita.data.datasets[1].data = anterior.serie[metrica];
    receita.options.scales.y.ticks.callback = metrica === 'faturamento'
      ? (v) => Formato.moedaCompacta.format(v)
      : (v) => Formato.inteiro.format(v);
    // Em 7 dias, mostro pontos: com tão poucos dados, a curva sozinha engana.
    receita.data.datasets[0].pointRadius = baldes.rotulos.length <= 12 ? 3 : 0;
    receita.update();

    // Resumo em texto para leitor de tela (o canvas em si é só uma imagem).
    const serie = atual.serie[metrica];
    const max = Math.max(...serie);
    const iMax = serie.indexOf(max);
    receita.canvas.setAttribute('aria-label',
      `Gráfico de área: ${metrica === 'faturamento' ? 'receita' : 'pedidos'} por ${porMes ? 'mês' : 'dia'}. ` +
      `Total ${formatar(serie.reduce((a, b) => a + b, 0))}; pico em ${contextoReceita.rotulosLongos[iMax]} com ${formatar(max)}. ` +
      'Os valores estão na tabela "Ver dados em tabela" logo abaixo.');
    tabelaDeDados(contextoReceita.rotulosLongos, serie, anterior.serie[metrica], formatar);
  }

  function tabelaDeDados(rotulos, atual, anterior, formatar) {
    const tabela = document.getElementById('tabela-receita');
    tabela.replaceChildren(
      h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: 'Período' }), h('th', { scope: 'col', text: 'Atual' }), h('th', { scope: 'col', text: 'Anterior' }))),
      h('tbody', {}, rotulos.map((r, i) => h('tr', {},
        h('th', { scope: 'row', text: r }), h('td', { text: formatar(atual[i]) }), h('td', { text: formatar(anterior[i]) })))),
    );
  }

  /* ---------- Rosca de categorias ---------- */
  let rosca = null;
  let categorias = [];
  const legenda = document.getElementById('legenda-categorias');
  const centroRotulo = document.getElementById('rosca-rotulo');
  const centroValor = document.getElementById('rosca-valor');

  function mostrarCentro(indice) {
    const total = categorias.reduce((s, c) => s + c.total, 0);
    if (indice == null) {
      centroRotulo.textContent = 'Total';
      centroValor.textContent = Formato.moedaCompacta.format(total);
      legenda.classList.remove('focando');
      legenda.querySelectorAll('li').forEach((li) => li.classList.remove('ativo'));
      return;
    }
    const c = categorias[indice];
    centroRotulo.textContent = c.nome;
    centroValor.textContent = Formato.moedaCompacta.format(c.total);
    legenda.classList.add('focando');
    legenda.querySelectorAll('li').forEach((li, i) => li.classList.toggle('ativo', i === indice));
  }

  function criarRosca() {
    rosca = new Chart(document.getElementById('grafico-categorias'), {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], borderWidth: 3, borderRadius: 5, hoverOffset: 6, spacing: 1 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        // Quando o ranking muda de ordem, cada fatia troca de cor; interpolar
        // cores de arrays no Chart.js 4.4 quebrava o loop de animação. A troca
        // de ângulo continua animada, só a cor muda direto.
        animations: { colors: false },
        layout: { padding: 6 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        onHover: (_e, ativos) => mostrarCentro(ativos.length ? ativos[0].index : null),
      },
    });
    rosca.canvas.addEventListener('mouseleave', () => mostrarCentro(null));
  }

  // Destaca a fatia ao passar o mouse OU focar (teclado) no item da legenda.
  function destacarFatia(indice) {
    if (!rosca) return;
    rosca.setActiveElements(indice == null ? [] : [{ datasetIndex: 0, index: indice }]);
    rosca.update();
    mostrarCentro(indice);
  }

  function atualizarCategorias(lista) {
    if (!rosca) criarRosca();
    categorias = lista;
    const cores = corDasCategorias();
    const total = lista.reduce((s, c) => s + c.total, 0);
    const ds = rosca.data.datasets[0];
    rosca.data.labels = lista.map((c) => c.nome);
    ds.data = lista.map((c) => c.total);
    // A cor segue a categoria (não a posição), para não "trocar de cor" quando o ranking muda.
    ds.backgroundColor = lista.map((c) => cores[Dados.CATEGORIAS.findIndex((k) => k.id === c.id)]);
    ds.borderColor = css('--superficie');
    ds.hoverBorderColor = css('--superficie');
    rosca.update();

    legenda.replaceChildren(...lista.map((c, i) => {
      const pct = total ? c.total / total : 0;
      const li = h('li', { tabindex: '0', class: 'esq', style: `--c:${ds.backgroundColor[i]}` },
        h('span', { class: 'rosca__cor', 'aria-hidden': 'true' }),
        h('span', { class: 'rosca__nome', text: c.nome }),
        h('span', { class: 'rosca__pct', text: Formato.porcento.format(pct) }),
        h('span', { class: 'rosca__valor', text: Formato.moedaInteira.format(c.total) }),
        h('span', { class: 'so-leitor', text: `, ${Formato.moeda.format(c.total)}` }));
      li.addEventListener('mouseenter', () => destacarFatia(i));
      li.addEventListener('focus', () => destacarFatia(i));
      li.addEventListener('mouseleave', () => destacarFatia(null));
      li.addEventListener('blur', () => destacarFatia(null));
      return li;
    }));
    mostrarCentro(null);
    const top = lista[0];
    rosca.canvas.setAttribute('aria-label',
      `Gráfico de rosca da receita por categoria. Maior: ${top.nome}, ${Formato.porcento.format(total ? top.total / total : 0)}. Detalhes na lista ao lado.`);
  }

  // Ao trocar o tema, recolore sem recriar (as cores vêm das variáveis CSS).
  document.addEventListener('tema', () => {
    // Espera um frame: as variáveis CSS do novo tema já estão aplicadas.
    requestAnimationFrame(() => {
      if (receita) { aplicarTemaReceita(); receita.update('none'); }
      if (rosca) atualizarCategorias(categorias);
    });
  });

  globalThis.Graficos = { atualizarReceita, atualizarCategorias };
})();
