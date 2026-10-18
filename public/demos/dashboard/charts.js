/* ==========================================================================
   charts.js — os 3 gráficos (Chart.js)
   Responsabilidade única: desenhar. Recebe séries já calculadas (data.js)
   e não sabe nada sobre pedidos ou períodos.
   ========================================================================== */
(function () {
  'use strict';

  const graficos = { receita: null, categorias: null, semana: null };

  /* Lê uma variável CSS do tema atual. O canvas não "enxerga" o CSS, então as
     cores precisam ser passadas ao Chart.js como strings — lendo daqui, o CSS
     continua sendo a única fonte de verdade das cores. */
  function cssVar(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  }

  function animacao() {
    // Respeita "reduzir movimento" do sistema: sem animação nos gráficos.
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return reduzir ? false : { duration: 500 };
  }

  /* Aplica as cores do tema em um gráfico já criado. É usada na criação e
     também ao alternar o tema — evita duplicar código de cor. */
  function pintar(grafico, tipo) {
    const texto = cssVar('--chart-text');
    const grade = cssVar('--chart-grid');
    Object.values(grafico.options.scales).forEach((escala) => {
      escala.ticks.color = texto;
      escala.grid.color = grade;
    });
    const serie = grafico.data.datasets[0];
    if (tipo === 'receita') {
      serie.borderColor = cssVar('--accent');
      serie.backgroundColor = cssVar('--accent-fill');
      serie.pointBackgroundColor = cssVar('--accent');
    } else {
      serie.backgroundColor = cssVar(tipo === 'semana' ? '--accent-2' : '--accent');
    }
    grafico.update('none'); // 'none' = sem animação ao só trocar cores
  }

  const baseOpcoes = () => ({
    responsive: true,
    maintainAspectRatio: false, // a altura vem do CSS (.grafico__area)
    animation: animacao(),
    plugins: { legend: { display: false } },
  });

  const tooltipMoeda = {
    callbacks: { label: (ctx) => ` ${Formato.moeda.format(ctx.parsed.y ?? ctx.parsed.x)}` },
  };

  function criarReceita(canvas) {
    return new Chart(canvas, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Faturamento', data: [], fill: true, tension: 0.3, borderWidth: 2, pointHoverRadius: 5 }] },
      options: {
        ...baseOpcoes(),
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: tooltipMoeda },
        scales: {
          x: { ticks: { maxTicksLimit: 8, maxRotation: 0 }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { callback: (v) => Formato.moedaCompacta.format(v) }, grid: {} },
        },
      },
    });
  }

  function criarCategorias(canvas) {
    return new Chart(canvas, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Faturamento', data: [], borderRadius: 4 }] },
      options: {
        ...baseOpcoes(),
        indexAxis: 'y', // barras horizontais: nomes de categoria ficam legíveis, sem legenda
        plugins: { legend: { display: false }, tooltip: tooltipMoeda },
        scales: {
          x: { beginAtZero: true, ticks: { maxTicksLimit: 5, callback: (v) => Formato.moedaCompacta.format(v) }, grid: {} },
          y: { ticks: {}, grid: { display: false } },
        },
      },
    });
  }

  function criarSemana(canvas) {
    return new Chart(canvas, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Pedidos', data: [], borderRadius: 4 }] },
      options: {
        ...baseOpcoes(),
        scales: {
          x: { ticks: {}, grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: {} }, // pedidos são inteiros
        },
      },
    });
  }

  /* ---------- Resumos em texto (aria-label) ----------
     Um canvas é só uma imagem para leitor de tela. Por isso cada gráfico recebe
     um resumo escrito com o que um usuário vidente concluiria olhando. */
  function resumoReceita(serie, periodo) {
    const total = serie.valores.reduce((a, b) => a + b, 0);
    const maior = Math.max(...serie.valores);
    const rotuloMaior = serie.rotulos[serie.valores.indexOf(maior)];
    const unidade = periodo.granularidade === 'mes' ? 'mês' : 'dia';
    return `Gráfico de linha do faturamento por ${unidade}. Total de ${Formato.moeda.format(total)}. `
      + `Melhor ${unidade}: ${rotuloMaior}, com ${Formato.moeda.format(maior)}.`;
  }

  function resumoCategorias(lista) {
    const total = lista.reduce((a, c) => a + c.total, 0);
    const [lider, segundo] = lista;
    if (!total) return 'Gráfico de barras do faturamento por categoria. Sem vendas no período.';
    const parte = Formato.percentual.format(lider.total / total).replace('+', '');
    return `Gráfico de barras do faturamento por categoria. Líder: ${lider.categoria}, com ${Formato.moeda.format(lider.total)} (${parte} do total). `
      + `Em seguida: ${segundo.categoria}, com ${Formato.moeda.format(segundo.total)}.`;
  }

  function resumoSemana(serie) {
    const maior = Math.max(...serie.valores);
    if (!maior) return 'Gráfico de barras dos pedidos por dia da semana. Sem pedidos no período.';
    const dias = serie.rotulos.filter((_, i) => serie.valores[i] === maior).join(' e ');
    return `Gráfico de barras dos pedidos por dia da semana. Mais pedidos em: ${dias}, com ${maior} pedido(s).`;
  }

  /* ---------- API pública ---------- */
  const Graficos = {
    disponivel: typeof Chart !== 'undefined',

    iniciar() {
      if (!this.disponivel) {
        // CDN fora do ar/sem internet: avisa em vez de deixar um buraco em branco.
        document.querySelectorAll('.grafico__area').forEach((area) => {
          area.innerHTML = '<p class="grafico__erro">Não foi possível carregar a biblioteca de gráficos (Chart.js). Verifique sua conexão.</p>';
        });
        return;
      }
      Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
      graficos.receita = criarReceita(document.getElementById('grafico-receita'));
      graficos.categorias = criarCategorias(document.getElementById('grafico-categorias'));
      graficos.semana = criarSemana(document.getElementById('grafico-semana'));
    },

    // dados = { periodo, receita, categorias, semana }
    atualizar(dados) {
      if (!this.disponivel) return;

      const { receita, categorias, semana, periodo } = dados;

      graficos.receita.data.labels = receita.rotulos;
      graficos.receita.data.datasets[0].data = receita.valores;
      // Muitos pontos (30 dias) ficam poluídos com bolinhas; mostro só no 7 dias e 12 meses.
      graficos.receita.data.datasets[0].pointRadius = receita.valores.length > 14 ? 0 : 4;

      graficos.categorias.data.labels = categorias.map((c) => c.categoria);
      graficos.categorias.data.datasets[0].data = categorias.map((c) => c.total);

      graficos.semana.data.labels = semana.rotulos;
      graficos.semana.data.datasets[0].data = semana.valores;

      document.getElementById('grafico-receita').setAttribute('aria-label', resumoReceita(receita, periodo));
      document.getElementById('grafico-categorias').setAttribute('aria-label', resumoCategorias(categorias));
      document.getElementById('grafico-semana').setAttribute('aria-label', resumoSemana(semana));

      Object.values(graficos).forEach((g) => {
        g.options.animation = animacao();
        g.update();
      });
      this.recolorir();
    },

    // Chamado também quando o usuário troca o tema.
    recolorir() {
      if (!this.disponivel || !graficos.receita) return;
      pintar(graficos.receita, 'receita');
      pintar(graficos.categorias, 'categorias');
      pintar(graficos.semana, 'semana');
    },
  };

  globalThis.Graficos = Graficos;
})();
