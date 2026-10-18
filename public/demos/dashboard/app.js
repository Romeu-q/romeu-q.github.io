/* ==========================================================================
   app.js — "cola" da aplicação
   Guarda o estado global (período, tema, menu) e, a cada mudança, manda os
   módulos se atualizarem: Dados calcula → Graficos/Tabela/KPIs desenham.
   Fluxo de dados em uma direção só: estado → render().
   ========================================================================== */
(function () {
  'use strict';

  const CHAVE_TEMA = 'dashboard-tema';

  const estado = { periodo: '30' };

  const el = {
    app: document.getElementById('app'),
    botaoMenu: document.getElementById('botao-menu'),
    sidebar: document.getElementById('sidebar'),
    coluna: document.querySelector('.coluna'),
    overlay: document.getElementById('overlay'),
    botaoTema: document.getElementById('botao-tema'),
    botoesPeriodo: document.querySelectorAll('.periodo__btn'),
    notaPeriodo: document.getElementById('nota-periodo'),
    cartoes: document.querySelectorAll('[data-kpi]'),
  };

  // Mesmo ponto de corte do CSS (@media max-width: 900px).
  const telaPequena = window.matchMedia('(max-width: 900px)');

  /* ---------- KPIs ---------- */
  const FORMATADORES_KPI = {
    faturamento: (v) => Formato.moeda.format(v),
    pedidos: (v) => Formato.inteiro.format(v),
    ticket: (v) => Formato.moeda.format(v),
    novos: (v) => Formato.inteiro.format(v),
  };

  function desenharVariacao(elemento, variacao) {
    elemento.className = 'kpi__variacao';
    elemento.replaceChildren();

    if (variacao === null) {
      elemento.textContent = 'Sem base de comparação';
      return;
    }
    // Seta + sinal + texto: o sentido da mudança não depende da cor.
    const sobe = variacao > 0;
    const desce = variacao < 0;
    elemento.classList.add(sobe ? 'kpi__variacao--alta' : desce ? 'kpi__variacao--baixa' : 'kpi__variacao--neutra');

    const forte = document.createElement('strong');
    const seta = document.createElement('span');
    seta.setAttribute('aria-hidden', 'true');
    seta.textContent = sobe ? '▲ ' : desce ? '▼ ' : '● ';
    const leitor = document.createElement('span');
    leitor.className = 'so-leitor';
    leitor.textContent = sobe ? 'Alta de ' : desce ? 'Queda de ' : 'Estável, ';
    forte.append(seta, leitor, Formato.percentual.format(variacao));
    elemento.append(forte, ' vs. período anterior');
  }

  function desenharKpis(kpis) {
    el.cartoes.forEach((cartao) => {
      const chave = cartao.dataset.kpi;
      cartao.querySelector('.kpi__valor').textContent = FORMATADORES_KPI[chave](kpis.atual[chave]);
      desenharVariacao(cartao.querySelector('.kpi__variacao'), kpis.variacoes[chave]);
    });
  }

  function descreverIntervalo(periodo) {
    const de = Formato.data(Dados.dataDoDia(periodo.inicio));
    const ate = Formato.data(Dados.dataDoDia(periodo.fim));
    return `${de} a ${ate}`;
  }

  /* ---------- Render principal ---------- */
  function renderizar() {
    const periodo = Dados.periodoDe(estado.periodo);
    const anterior = Dados.periodoAnterior(periodo);

    desenharKpis(Dados.calcularKpis(periodo));
    el.notaPeriodo.textContent = `Período: ${descreverIntervalo(periodo)} · comparado com ${descreverIntervalo(anterior)}`;

    Graficos.atualizar({
      periodo,
      receita: Dados.serieDeFaturamento(periodo),
      categorias: Dados.faturamentoPorCategoria(periodo),
      semana: Dados.pedidosPorDiaDaSemana(periodo),
    });
    Tabela.definirPedidos(Dados.pedidosNoPeriodo(periodo));
  }

  function escolherPeriodo(chave) {
    estado.periodo = chave;
    el.botoesPeriodo.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.periodo === chave)));
    renderizar();
  }

  /* ---------- Tema ---------- */
  function lerTemaSalvo() {
    try { return localStorage.getItem(CHAVE_TEMA); } catch (e) { return null; } // storage pode estar bloqueado
  }

  function salvarTema(tema) {
    try { localStorage.setItem(CHAVE_TEMA, tema); } catch (e) { /* sem persistência, mas segue funcionando */ }
  }

  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    el.botaoTema.setAttribute('aria-pressed', String(tema === 'dark'));
    Graficos.recolorir(); // o canvas não muda sozinho com o CSS: precisa ser repintado
  }

  function iniciarTema() {
    const atual = document.documentElement.getAttribute('data-theme') || 'light'; // já definido no <head>
    aplicarTema(atual);

    el.botaoTema.addEventListener('click', () => {
      const novo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      aplicarTema(novo);
      salvarTema(novo);
    });

    // Se o usuário nunca escolheu, acompanha o sistema operacional em tempo real.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!lerTemaSalvo()) aplicarTema(e.matches ? 'dark' : 'light');
    });
  }

  /* ---------- Menu lateral ----------
     Desktop: botão recolhe/expande (só ícones).
     Celular: botão abre/fecha a gaveta por cima do conteúdo. */
  function menuAberto() {
    return telaPequena.matches
      ? el.app.classList.contains('app--menu-aberto')
      : !el.app.classList.contains('app--recolhido');
  }

  function sincronizarBotaoMenu() {
    el.botaoMenu.setAttribute('aria-expanded', String(menuAberto()));
    // Gaveta aberta no celular: o resto da página fica inerte (Tab não escapa para trás do overlay).
    el.coluna.inert = telaPequena.matches && el.app.classList.contains('app--menu-aberto');
  }

  function fecharGaveta(devolverFoco) {
    el.app.classList.remove('app--menu-aberto');
    sincronizarBotaoMenu();
    if (devolverFoco) el.botaoMenu.focus();
  }

  function alternarMenu() {
    if (telaPequena.matches) {
      const abrir = !el.app.classList.contains('app--menu-aberto');
      el.app.classList.toggle('app--menu-aberto', abrir);
      sincronizarBotaoMenu();
      // Ao abrir, leva o foco para dentro do menu (senão o teclado ficaria "atrás" do overlay).
      if (abrir) el.sidebar.querySelector('.nav__link').focus();
    } else {
      el.app.classList.toggle('app--recolhido');
      sincronizarBotaoMenu();
    }
  }

  function iniciarMenu() {
    el.botaoMenu.addEventListener('click', alternarMenu);
    el.overlay.addEventListener('click', () => fecharGaveta(true));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.app.classList.contains('app--menu-aberto')) fecharGaveta(true);
    });

    el.sidebar.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', () => {
        el.sidebar.querySelectorAll('.nav__link').forEach((l) => l.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'page');
        if (telaPequena.matches) fecharGaveta(false);
      });
    });

    // Girou o celular / redimensionou a janela: não deixa a gaveta "presa" aberta.
    telaPequena.addEventListener('change', () => fecharGaveta(false));
    sincronizarBotaoMenu();
  }

  /* ---------- Início ---------- */
  Graficos.iniciar();
  Tabela.iniciar();
  iniciarTema();
  iniciarMenu();
  el.botoesPeriodo.forEach((b) => b.addEventListener('click', () => escolherPeriodo(b.dataset.periodo)));
  escolherPeriodo(estado.periodo);
})();
