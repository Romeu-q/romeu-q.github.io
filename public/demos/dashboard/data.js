/* ==========================================================================
   data.js — dados fictícios + funções de agregação
   --------------------------------------------------------------------------
   Nada aqui toca no DOM. Só gera pedidos (mock) e calcula números a partir
   deles. Assim, KPIs e gráficos são SEMPRE derivados do array de pedidos:
   se eu mudar um pedido, tudo muda junto (não existe número "chumbado").
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Gerador pseudoaleatório com semente ----------
     Math.random() devolve valores diferentes a cada carregamento. Numa demo
     isso é ruim: o gráfico mudaria a cada F5, os prints do portfólio não
     bateriam com o site e eu não conseguiria reproduzir um bug.
     O mulberry32 recebe uma "semente" e sempre devolve a mesma sequência,
     então a loja fictícia é idêntica para todo mundo, em qualquer máquina. */
  function mulberry32(semente) {
    let a = semente >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // número em [0, 1)
    };
  }

  const aleatorio = mulberry32(20261018);

  const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];

  // Sorteio com pesos: itens com peso maior aparecem mais vezes.
  function sortearComPeso(itens) {
    const total = itens.reduce((soma, i) => soma + i.peso, 0);
    let alvo = aleatorio() * total;
    for (const item of itens) {
      alvo -= item.peso;
      if (alvo < 0) return item;
    }
    return itens[itens.length - 1];
  }

  /* ---------- 2. "Hoje" fixo ----------
     Também por reprodutibilidade: se usasse new Date(), o dashboard "andaria"
     com o calendário e os dados mock ficariam velhos. Uso meio-dia (12h) para
     fugir de problemas de fuso horário/horário de verão na virada do dia. */
  const HOJE = new Date(2026, 9, 18, 12); // 18/10/2026 (mês começa em 0)

  // Geramos 24 meses: os últimos 12 são o que o painel mostra; os 12 anteriores
  // existem só para dar base de comparação ("vs. período anterior") em 12 meses
  // e para saber quem já era cliente antes (cálculo de "novos clientes").
  const DIAS_TOTAIS = 730;
  const ULTIMO_DIA = DIAS_TOTAIS - 1;

  // Trabalho com "índice de dia" (0 = dia mais antigo, 729 = hoje). Comparar
  // inteiros é mais simples e seguro do que comparar objetos Date.
  function dataDoDia(indice) {
    return new Date(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate() - (ULTIMO_DIA - indice), 12);
  }

  function diaDaData(data) {
    // Date.UTC ignora fuso: a diferença entre dois dias sempre é múltiplo exato de 24h.
    const ms = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
      - Date.UTC(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate());
    return ULTIMO_DIA + Math.round(ms / 86400000);
  }

  /* ---------- 3. Catálogo e clientes ---------- */
  const CATEGORIAS = [
    { nome: 'Moda',             peso: 26, min: 60,  max: 400 },
    { nome: 'Casa e Decoração', peso: 20, min: 40,  max: 600 },
    { nome: 'Eletrônicos',      peso: 18, min: 150, max: 2500 },
    { nome: 'Esportes',         peso: 12, min: 50,  max: 500 },
    { nome: 'Livros',           peso: 12, min: 25,  max: 120 },
    { nome: 'Beleza',           peso: 12, min: 20,  max: 250 },
  ];

  const NOMES = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
    'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Queila',
    'Rafael', 'Sabrina', 'Thiago', 'Úrsula', 'Vinícius', 'Wesley', 'Yasmin'];
  const SOBRENOMES = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes',
    'Henrique', 'Ibrahim', 'Junqueira', 'Lima', 'Martins', 'Nogueira', 'Oliveira', 'Pereira',
    'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Uchoa', 'Vieira', 'Xavier', 'Zanetti', 'Souza'];

  function gerarClientes(quantidade) {
    const usados = new Set();
    const clientes = [];
    while (clientes.length < quantidade) {
      const nome = `${sortear(NOMES)} ${sortear(SOBRENOMES)}`;
      if (usados.has(nome)) continue; // nomes únicos para o "cliente" ser identificável
      usados.add(nome);
      clientes.push(nome);
    }
    return clientes;
  }

  // A base é maior do que a que vai ser usada: os clientes entram em cena aos poucos
  // (veja gerarPedidos), como numa loja que conquista gente nova o tempo todo.
  const CLIENTES = gerarClientes(420);
  // Chance de um pedido vir de um cliente que nunca comprou antes.
  const CHANCE_CLIENTE_NOVO = 0.3;

  /* ---------- 4. Geração dos pedidos ---------- */
  // Vendas costumam subir na sexta e cair no domingo: dá forma ao gráfico por dia da semana.
  const FATOR_DIA_SEMANA = [0.8, 1.0, 1.05, 1.0, 1.1, 1.25, 1.0]; // dom..sáb

  function statusPelaIdade(idadeEmDias) {
    // Pedido antigo já foi entregue; pedido recente ainda está a caminho.
    if (aleatorio() < 0.07) return 'Cancelado';
    if (idadeEmDias > 10) return 'Entregue';
    if (idadeEmDias > 3) return aleatorio() < 0.5 ? 'Entregue' : 'Enviado';
    return aleatorio() < 0.5 ? 'Enviado' : 'Pendente';
  }

  function gerarPedidos() {
    const lista = [];
    // Quantos clientes já "apareceram" na loja: CLIENTES[0..apresentados-1] são os
    // recorrentes e CLIENTES[apresentados] é o próximo cliente novo da fila.
    // Com um grupo fixo desde o dia 0, quase todo mundo já teria comprado no 1º ano e
    // o KPI "Novos clientes" despencaria de forma artificial no 2º.
    let apresentados = 0;
    for (let dia = 0; dia < DIAS_TOTAIS; dia++) {
      const data = dataDoDia(dia);
      // A loja "cresce" ao longo do tempo: taxa diária sobe de ~0,75 a ~1,2 pedidos/dia.
      const taxa = (0.75 + 0.45 * (dia / ULTIMO_DIA)) * FATOR_DIA_SEMANA[data.getDay()];
      // Parte inteira da taxa + chance de um pedido extra pela parte decimal.
      let quantidade = Math.floor(taxa);
      if (aleatorio() < taxa - quantidade) quantidade++;

      for (let i = 0; i < quantidade; i++) {
        const categoria = sortearComPeso(CATEGORIAS);
        const precoUnitario = categoria.min + aleatorio() * (categoria.max - categoria.min);
        const itens = aleatorio() < 0.2 ? 2 + Math.floor(aleatorio() * 2) : 1;
        // O pedido é de um cliente novo (próximo da fila) ou de um recorrente. Elevar ao
        // quadrado "puxa" o sorteio para os clientes mais antigos: alguns compram muito
        // e outros pouco, como numa loja de verdade.
        const novo = apresentados === 0 || (apresentados < CLIENTES.length && aleatorio() < CHANCE_CLIENTE_NOVO);
        const cliente = novo
          ? CLIENTES[apresentados++]
          : CLIENTES[Math.floor(aleatorio() ** 2 * apresentados)];

        lista.push({
          dia,                                   // índice do dia (usado nos filtros)
          data,                                  // objeto Date (usado na exibição)
          cliente,
          categoria: categoria.nome,
          valor: Math.round(precoUnitario * itens) - 0.1, // preços "terminados em ,90"
          status: statusPelaIdade(ULTIMO_DIA - dia),
        });
      }
    }
    // Número do pedido sequencial, já que o loop anda do dia mais antigo ao mais novo.
    lista.forEach((pedido, i) => { pedido.numero = 1001 + i; });
    return lista;
  }

  const PEDIDOS = gerarPedidos();

  // Cancelado não é venda: fica fora de faturamento, ticket médio e contagem de pedidos.
  const ehVenda = (pedido) => pedido.status !== 'Cancelado';

  // Primeiro dia em que cada cliente comprou — base do KPI "Novos clientes".
  const PRIMEIRO_DIA_DO_CLIENTE = new Map();
  PEDIDOS.filter(ehVenda).forEach((pedido) => {
    if (!PRIMEIRO_DIA_DO_CLIENTE.has(pedido.cliente)) {
      PRIMEIRO_DIA_DO_CLIENTE.set(pedido.cliente, pedido.dia);
    }
  });

  /* ---------- 5. Períodos ---------- */
  // chave: '7' | '30' | '12m'. Devolve o intervalo [inicio, fim] em índices de dia.
  function periodoDe(chave) {
    let inicio;
    let granularidade = 'dia';
    if (chave === '12m') {
      // "12 meses" = meses de calendário completos + o mês atual até hoje.
      inicio = diaDaData(new Date(HOJE.getFullYear(), HOJE.getMonth() - 11, 1, 12));
      granularidade = 'mes';
    } else {
      inicio = ULTIMO_DIA - Number(chave) + 1;
    }
    return { chave, inicio, fim: ULTIMO_DIA, tamanho: ULTIMO_DIA - inicio + 1, granularidade };
  }

  // Período imediatamente anterior, com o mesmo número de dias.
  function periodoAnterior(periodo) {
    return {
      inicio: periodo.inicio - periodo.tamanho,
      fim: periodo.inicio - 1,
      tamanho: periodo.tamanho,
      granularidade: periodo.granularidade,
    };
  }

  function pedidosNoPeriodo(periodo) {
    return PEDIDOS.filter((p) => p.dia >= periodo.inicio && p.dia <= periodo.fim);
  }

  /* ---------- 6. Agregações ---------- */
  function somar(pedidos) {
    return pedidos.reduce((total, p) => total + p.valor, 0);
  }

  function resumoDoPeriodo(periodo) {
    const vendas = pedidosNoPeriodo(periodo).filter(ehVenda);
    const faturamento = somar(vendas);
    let novos = 0;
    PRIMEIRO_DIA_DO_CLIENTE.forEach((dia) => {
      if (dia >= periodo.inicio && dia <= periodo.fim) novos++;
    });
    return {
      faturamento,
      pedidos: vendas.length,
      ticket: vendas.length ? faturamento / vendas.length : 0,
      novos,
    };
  }

  // Variação como fração (0,123 = +12,3%). Sem base de comparação (anterior = 0) → null,
  // porque dividir por zero daria "Infinity%" na tela.
  function variacao(atual, anterior) {
    return anterior === 0 ? null : (atual - anterior) / anterior;
  }

  function calcularKpis(periodo) {
    const atual = resumoDoPeriodo(periodo);
    const anterior = resumoDoPeriodo(periodoAnterior(periodo));
    const variacoes = {};
    Object.keys(atual).forEach((chave) => {
      variacoes[chave] = variacao(atual[chave], anterior[chave]);
    });
    return { atual, anterior, variacoes };
  }

  // Série do gráfico de linha: um ponto por dia (7 e 30 dias) ou por mês (12 meses).
  function serieDeFaturamento(periodo) {
    const vendas = pedidosNoPeriodo(periodo).filter(ehVenda);
    const rotulos = [];
    const valores = [];

    if (periodo.granularidade === 'dia') {
      for (let dia = periodo.inicio; dia <= periodo.fim; dia++) {
        rotulos.push(dataDoDia(dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        valores.push(0);
      }
      vendas.forEach((p) => { valores[p.dia - periodo.inicio] += p.valor; });
    } else {
      const primeiro = dataDoDia(periodo.inicio);
      const indiceMes = (d) => (d.getFullYear() - primeiro.getFullYear()) * 12 + d.getMonth() - primeiro.getMonth();
      const meses = indiceMes(dataDoDia(periodo.fim)) + 1;
      for (let m = 0; m < meses; m++) {
        const mes = new Date(primeiro.getFullYear(), primeiro.getMonth() + m, 1, 12);
        rotulos.push(mes.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace(' de ', '/'));
        valores.push(0);
      }
      vendas.forEach((p) => { valores[indiceMes(p.data)] += p.valor; });
    }
    return { rotulos, valores };
  }

  // Faturamento por categoria, da maior para a menor (ordem boa para barras horizontais).
  function faturamentoPorCategoria(periodo) {
    const totais = new Map(CATEGORIAS.map((c) => [c.nome, 0]));
    pedidosNoPeriodo(periodo).filter(ehVenda).forEach((p) => {
      totais.set(p.categoria, totais.get(p.categoria) + p.valor);
    });
    return [...totais.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }

  // Pedidos por dia da semana, começando na segunda (padrão de calendário comercial no Brasil).
  function pedidosPorDiaDaSemana(periodo) {
    const rotulos = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const valores = [0, 0, 0, 0, 0, 0, 0];
    pedidosNoPeriodo(periodo).filter(ehVenda).forEach((p) => {
      valores[(p.data.getDay() + 6) % 7]++; // getDay(): 0 = domingo → vira índice 6
    });
    return { rotulos, valores };
  }

  /* ---------- 7. Formatação (compartilhada por tabela, KPIs e gráficos) ----------
     Criar um Intl.NumberFormat é "caro"; por isso crio uma vez e reutilizo. */
  const Formato = {
    moeda: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    moedaCompacta: new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
    }),
    inteiro: new Intl.NumberFormat('pt-BR'),
    // signDisplay 'exceptZero' coloca "+" nos positivos: o sinal fica no texto, não só na cor.
    percentual: new Intl.NumberFormat('pt-BR', {
      style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero',
    }),
    data: (data) => data.toLocaleDateString('pt-BR'),
  };

  globalThis.Formato = Formato;
  globalThis.Dados = {
    pedidos: PEDIDOS,
    periodoDe,
    periodoAnterior,
    pedidosNoPeriodo,
    calcularKpis,
    serieDeFaturamento,
    faturamentoPorCategoria,
    pedidosPorDiaDaSemana,
    dataDoDia,
    ehVenda,
  };
})();
