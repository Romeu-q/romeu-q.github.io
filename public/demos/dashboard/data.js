/* ==========================================================================
   data.js — loja fictícia + agregações
   --------------------------------------------------------------------------
   Nada aqui toca no DOM. Este arquivo só (1) gera pedidos falsos de forma
   reprodutível e (2) calcula números a partir deles. KPIs, gráficos, ranking
   e tabela são SEMPRE derivados do mesmo array de pedidos: não existe número
   "chumbado" no HTML. Se eu mudar a regra de geração, tudo muda junto.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Gerador pseudoaleatório com semente (mulberry32) ----------
     Math.random() muda a cada F5: o print do portfólio não bateria com o site
     e eu não conseguiria reproduzir um bug. Com semente fixa, a "loja" é
     idêntica em qualquer máquina, sempre. */
  function mulberry32(semente) {
    let a = semente >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // [0, 1)
    };
  }

  const aleatorio = mulberry32(20261018);
  const sortear = (lista) => lista[Math.floor(aleatorio() * lista.length)];

  // Sorteio com pesos: quem tem peso maior sai mais vezes.
  function sortearComPeso(itens, campo = 'peso') {
    const total = itens.reduce((soma, i) => soma + i[campo], 0);
    let alvo = aleatorio() * total;
    for (const item of itens) {
      alvo -= item[campo];
      if (alvo < 0) return item;
    }
    return itens[itens.length - 1];
  }

  /* ---------- 2. "Agora" fixo ----------
     Também por reprodutibilidade: com new Date() o painel "andaria" com o
     calendário. O dia de hoje é parcial (até 20h45), como num painel real. */
  const AGORA = new Date(2026, 9, 18, 20, 45);
  const MINUTO_AGORA = AGORA.getHours() * 60 + AGORA.getMinutes();

  // 24 meses: os 12 últimos aparecem no painel; os anteriores servem de base
  // para "vs. período anterior" e para saber quem já era cliente.
  const DIAS_TOTAIS = 730;
  const ULTIMO_DIA = DIAS_TOTAIS - 1;

  // Trabalho com "índice de dia" (0 = mais antigo, 729 = hoje): comparar
  // inteiros é mais simples e seguro do que comparar objetos Date.
  function dataDoDia(indice, minutos = 720) {
    return new Date(AGORA.getFullYear(), AGORA.getMonth(), AGORA.getDate() - (ULTIMO_DIA - indice),
      Math.floor(minutos / 60), minutos % 60);
  }

  function diaDaData(data) {
    // Date.UTC ignora fuso/horário de verão: a diferença é sempre múltipla de 24h.
    const ms = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
      - Date.UTC(AGORA.getFullYear(), AGORA.getMonth(), AGORA.getDate());
    return ULTIMO_DIA + Math.round(ms / 86400000);
  }

  /* ---------- 3. Catálogo: e-commerce de alimentos artesanais ---------- */
  const CATEGORIAS = [
    { id: 'cafe',    nome: 'Cafés especiais',   peso: 26 },
    { id: 'queijo',  nome: 'Queijos e frios',   peso: 20 },
    { id: 'doces',   nome: 'Doces e chocolates', peso: 18 },
    { id: 'padaria', nome: 'Padaria',           peso: 14 },
    { id: 'bebidas', nome: 'Bebidas',           peso: 12 },
    { id: 'kits',    nome: 'Kits presente',     peso: 5 },
  ];

  const PRODUTOS = [
    { nome: 'Café Mantiqueira 250g',        categoria: 'cafe',    preco: 49.9,  peso: 9 },
    { nome: 'Café Cerrado Mineiro 500g',    categoria: 'cafe',    preco: 72.9,  peso: 6 },
    { nome: 'Cápsulas Espresso (10 un.)',   categoria: 'cafe',    preco: 29.9,  peso: 8 },
    { nome: 'Café Bourbon Amarelo 250g',    categoria: 'cafe',    preco: 58.9,  peso: 4 },
    { nome: 'Queijo Canastra meia-cura',    categoria: 'queijo',  preco: 89.9,  peso: 7 },
    { nome: 'Queijo Serro 500g',            categoria: 'queijo',  preco: 64.9,  peso: 5 },
    { nome: 'Salame tipo italiano 200g',    categoria: 'queijo',  preco: 39.9,  peso: 5 },
    { nome: 'Brigadeiro gourmet (cx. 12)',  categoria: 'doces',   preco: 54.9,  peso: 8 },
    { nome: 'Chocolate 70% cacau Bahia',    categoria: 'doces',   preco: 24.9,  peso: 7 },
    { nome: 'Doce de leite viçosa 400g',    categoria: 'doces',   preco: 27.9,  peso: 5 },
    { nome: 'Pão de queijo congelado 1kg',  categoria: 'padaria', preco: 36.9,  peso: 9 },
    { nome: 'Pão de fermentação natural',   categoria: 'padaria', preco: 22.9,  peso: 6 },
    { nome: 'Granola artesanal 500g',       categoria: 'padaria', preco: 31.9,  peso: 4 },
    { nome: 'Cachaça envelhecida 700ml',    categoria: 'bebidas', preco: 119.9, peso: 4 },
    { nome: 'Kombucha gengibre (4 un.)',    categoria: 'bebidas', preco: 44.9,  peso: 6 },
    { nome: 'Suco de caju integral 1L',     categoria: 'bebidas', preco: 18.9,  peso: 5 },
    { nome: 'Kit Café da Manhã Mineiro',    categoria: 'kits',    preco: 189.9, peso: 5 },
    { nome: 'Cesta Degustação Premium',     categoria: 'kits',    preco: 329.9, peso: 1 },
  ];
  const PRODUTOS_POR_CATEGORIA = {};
  PRODUTOS.forEach((p) => { (PRODUTOS_POR_CATEGORIA[p.categoria] ||= []).push(p); });

  const NOMES = ['Ana', 'Bruno', 'Camila', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
    'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela',
    'Rafael', 'Sabrina', 'Thiago', 'Letícia', 'Vinícius', 'Wesley', 'Yasmin', 'Beatriz', 'Caio',
    'Larissa', 'Matheus', 'Juliana', 'Gustavo', 'Fernanda', 'Diego', 'Patrícia', 'Otávio'];
  const SOBRENOMES = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes',
    'Moura', 'Rocha', 'Junqueira', 'Lima', 'Martins', 'Nogueira', 'Oliveira', 'Pereira',
    'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Campos', 'Vieira', 'Xavier', 'Zanetti', 'Souza'];
  const CIDADES = [
    { nome: 'São Paulo, SP', peso: 30 }, { nome: 'Rio de Janeiro, RJ', peso: 16 },
    { nome: 'Belo Horizonte, MG', peso: 14 }, { nome: 'Curitiba, PR', peso: 9 },
    { nome: 'Porto Alegre, RS', peso: 7 }, { nome: 'Campinas, SP', peso: 7 },
    { nome: 'Salvador, BA', peso: 6 }, { nome: 'Recife, PE', peso: 5 },
    { nome: 'Brasília, DF', peso: 6 },
  ];
  const CANAIS = [{ nome: 'Site', peso: 46 }, { nome: 'App', peso: 36 }, { nome: 'Marketplace', peso: 18 }];
  const PAGAMENTOS = [{ nome: 'Pix', peso: 50 }, { nome: 'Cartão', peso: 43 }, { nome: 'Boleto', peso: 7 }];

  // Clientes são criados sob demanda (cliente novo = próximo da fila).
  const CLIENTES = [];
  function novoCliente() {
    const cliente = {
      id: CLIENTES.length + 1,
      nome: `${sortear(NOMES)} ${sortear(SOBRENOMES)}`,
      cidade: sortearComPeso(CIDADES).nome,
    };
    CLIENTES.push(cliente);
    return cliente;
  }

  /* ---------- 4. Geração dos pedidos ---------- */
  // Comida vende mais no fim de semana e na sexta (dom..sáb).
  const FATOR_DIA_SEMANA = [1.12, 0.84, 0.9, 0.95, 1.0, 1.2, 1.26];
  // Peso de cada hora do dia: picos no almoço e no começo da noite.
  const PESO_HORA = [1, 0.5, 0.3, 0.2, 0.2, 0.4, 1.2, 2.4, 3.2, 3.6, 4.2, 5.6,
    6.4, 5.2, 3.8, 3.4, 3.8, 4.8, 6.6, 7.4, 6.8, 5.0, 3.2, 1.8].map((peso, hora) => ({ hora, peso }));
  const CHANCE_CLIENTE_NOVO = 0.24;

  function statusDoPedido(idadeEmMinutos) {
    if (aleatorio() < 0.035) return 'Cancelado';
    if (idadeEmMinutos > 60 * 30) return 'Entregue';
    if (idadeEmMinutos > 60 * 6) return aleatorio() < 0.7 ? 'Entregue' : 'Em rota';
    if (idadeEmMinutos > 60) return aleatorio() < 0.6 ? 'Em rota' : 'Preparando';
    return 'Preparando';
  }

  function gerarItens() {
    // Uma categoria "puxa" o pedido; às vezes o cliente leva algo de outra.
    const principal = sortearComPeso(CATEGORIAS);
    const linhas = 1 + (aleatorio() < 0.45 ? 1 : 0) + (aleatorio() < 0.15 ? 1 : 0);
    const itens = [];
    for (let i = 0; i < linhas; i++) {
      const categoria = i === 0 || aleatorio() < 0.55 ? principal : sortearComPeso(CATEGORIAS);
      const produto = sortearComPeso(PRODUTOS_POR_CATEGORIA[categoria.id]);
      if (itens.some((it) => it.produto === produto)) continue; // sem item repetido
      itens.push({ produto, qtd: aleatorio() < 0.25 ? 2 : 1 });
    }
    return itens;
  }

  function gerarPedidos() {
    const lista = [];
    for (let dia = 0; dia < DIAS_TOTAIS; dia++) {
      const data = dataDoDia(dia);
      // A loja cresce: de ~20 a ~36 pedidos/dia, com sazonalidade de dezembro (Natal).
      const mes = data.getMonth();
      const sazonal = mes === 11 ? 1.35 : mes === 10 ? 1.1 : mes === 0 ? 0.9 : 1;
      const taxa = (20 + 16 * (dia / ULTIMO_DIA)) * FATOR_DIA_SEMANA[data.getDay()] * sazonal
        * (0.85 + aleatorio() * 0.3);
      const quantidade = Math.round(taxa);

      const doDia = [];
      for (let i = 0; i < quantidade; i++) {
        const minutos = sortearComPeso(PESO_HORA).hora * 60 + Math.floor(aleatorio() * 60);
        // Hoje só existe o que já aconteceu até "agora".
        if (dia === ULTIMO_DIA && minutos > MINUTO_AGORA) continue;
        doDia.push(minutos);
      }
      doDia.sort((a, b) => a - b); // nº do pedido cresce com o horário

      for (const minutos of doDia) {
        const itens = gerarItens();
        const novo = CLIENTES.length === 0 || aleatorio() < CHANCE_CLIENTE_NOVO;
        // Elevar ao quadrado "puxa" o sorteio para clientes antigos e fiéis.
        const cliente = novo ? novoCliente() : CLIENTES[Math.floor((1 - aleatorio() ** 2) * CLIENTES.length)];
        const total = itens.reduce((s, it) => s + it.produto.preco * it.qtd, 0);
        const idade = (ULTIMO_DIA - dia) * 1440 + (MINUTO_AGORA - minutos);
        lista.push({
          dia,
          minutos,
          data: dataDoDia(dia, minutos),
          hora: Math.floor(minutos / 60),
          cliente,
          novoCliente: novo,
          itens,
          categoria: itens[0].produto.categoria, // categoria "principal" do pedido
          canal: sortearComPeso(CANAIS).nome,
          pagamento: sortearComPeso(PAGAMENTOS).nome,
          // Frete grátis acima de R$ 150; abaixo disso, R$ 14,90.
          total: Math.round((total + (total >= 150 ? 0 : 14.9)) * 100) / 100,
          status: statusDoPedido(idade),
        });
      }
    }
    lista.forEach((p, i) => { p.numero = 18001 + i; });
    return lista;
  }

  const PEDIDOS = gerarPedidos();
  // Cancelado não é venda: fica fora de faturamento, ticket e contagem.
  const ehVenda = (p) => p.status !== 'Cancelado';

  // Índice por dia: filtrar 30 mil pedidos a cada clique seria desperdício;
  // assim pego direto as fatias de dias que interessam.
  const POR_DIA = Array.from({ length: DIAS_TOTAIS }, () => []);
  PEDIDOS.forEach((p) => POR_DIA[p.dia].push(p));

  /* ---------- 5. Períodos ---------- */
  // chave: '7' | '30' | '12m'. "deslocamento" = quantos dias voltar para achar
  // o período de comparação. Em 12 meses uso 364 (52 semanas exatas), para que
  // sexta seja comparada com sexta e o efeito do fim de semana não distorça.
  function periodoDe(chave) {
    if (chave === '12m') {
      const inicio = diaDaData(new Date(AGORA.getFullYear(), AGORA.getMonth() - 11, 1, 12));
      return { chave, inicio, fim: ULTIMO_DIA, granularidade: 'mes', deslocamento: 364 };
    }
    const n = Number(chave);
    return { chave, inicio: ULTIMO_DIA - n + 1, fim: ULTIMO_DIA, granularidade: 'dia', deslocamento: n };
  }

  function periodoAnterior(periodo) {
    return { ...periodo, inicio: periodo.inicio - periodo.deslocamento, fim: periodo.fim - periodo.deslocamento };
  }

  function pedidosNoPeriodo(periodo) {
    const lista = [];
    for (let d = Math.max(0, periodo.inicio); d <= periodo.fim; d++) lista.push(...POR_DIA[d]);
    return lista;
  }

  /* ---------- 6. Agregações ---------- */
  // "Baldes" do eixo X: um por dia (7/30d) ou por mês (12m). Devolve rótulos e
  // uma função que diz em qual balde cai cada dia do período.
  function baldesDo(periodo) {
    if (periodo.granularidade === 'dia') {
      const rotulos = [];
      for (let d = periodo.inicio; d <= periodo.fim; d++) rotulos.push(dataDoDia(d));
      return { rotulos, indice: (dia) => dia - periodo.inicio };
    }
    const primeiro = dataDoDia(periodo.inicio);
    const idx = (data) => (data.getFullYear() - primeiro.getFullYear()) * 12 + data.getMonth() - primeiro.getMonth();
    const rotulos = [];
    for (let m = 0; m <= idx(dataDoDia(periodo.fim)); m++) {
      rotulos.push(new Date(primeiro.getFullYear(), primeiro.getMonth() + m, 1, 12));
    }
    return { rotulos, indice: (dia) => idx(dataDoDia(dia)) };
  }

  // Calcula tudo de um período numa passada só pelos pedidos.
  function resumir(periodo, baldes) {
    const n = baldes.rotulos.length;
    const r = {
      faturamento: 0, pedidos: 0, novos: 0, cancelados: 0,
      serie: { faturamento: new Array(n).fill(0), pedidos: new Array(n).fill(0), novos: new Array(n).fill(0) },
    };
    for (let d = Math.max(0, periodo.inicio); d <= periodo.fim; d++) {
      // Dias do período anterior caem no mesmo balde do dia "equivalente" atual.
      const b = baldes.indice(d + (periodo.base || 0));
      for (const p of POR_DIA[d]) {
        if (!ehVenda(p)) { r.cancelados++; continue; }
        r.faturamento += p.total;
        r.pedidos++;
        r.serie.faturamento[b] += p.total;
        r.serie.pedidos[b]++;
        if (p.novoCliente) { r.novos++; r.serie.novos[b]++; }
      }
    }
    r.ticket = r.pedidos ? r.faturamento / r.pedidos : 0;
    r.serie.ticket = r.serie.faturamento.map((v, i) => (r.serie.pedidos[i] ? v / r.serie.pedidos[i] : 0));
    return r;
  }

  // Variação como fração (0,123 = +12,3%). Sem base → null (evita "Infinity%").
  const variacao = (atual, anterior) => (anterior === 0 ? null : (atual - anterior) / anterior);

  function analisar(chave) {
    const periodo = periodoDe(chave);
    const baldes = baldesDo(periodo);
    const atual = resumir(periodo, baldes);
    const anterior = resumir({ ...periodoAnterior(periodo), base: periodo.deslocamento }, baldes);
    const pedidos = pedidosNoPeriodo(periodo);
    const vendas = pedidos.filter(ehVenda);

    const variacoes = {};
    ['faturamento', 'pedidos', 'ticket', 'novos'].forEach((k) => { variacoes[k] = variacao(atual[k], anterior[k]); });

    return {
      periodo, baldes, atual, anterior, variacoes, pedidos,
      categorias: porCategoria(vendas),
      // Mesmas categorias no período anterior, para dizer qual mais cresceu.
      categoriasAnteriores: porCategoria(pedidosNoPeriodo(periodoAnterior(periodo)).filter(ehVenda)),
      produtos: topProdutos(vendas, 6),
      calor: mapaDeCalor(vendas),
    };
  }

  function porCategoria(vendas) {
    const totais = new Map(CATEGORIAS.map((c) => [c.id, 0]));
    // Rateio por item: um pedido com café e queijo soma em ambas as categorias.
    vendas.forEach((p) => p.itens.forEach((it) => {
      totais.set(it.produto.categoria, totais.get(it.produto.categoria) + it.produto.preco * it.qtd);
    }));
    return CATEGORIAS.map((c) => ({ id: c.id, nome: c.nome, total: totais.get(c.id) }))
      .sort((a, b) => b.total - a.total);
  }

  function topProdutos(vendas, limite) {
    const mapa = new Map();
    vendas.forEach((p) => p.itens.forEach((it) => {
      const atual = mapa.get(it.produto) || { produto: it.produto, unidades: 0, receita: 0 };
      atual.unidades += it.qtd;
      atual.receita += it.produto.preco * it.qtd;
      mapa.set(it.produto, atual);
    }));
    return [...mapa.values()].sort((a, b) => b.receita - a.receita).slice(0, limite);
  }

  // Matriz 7 dias (seg..dom) × 12 faixas de 2 horas.
  function mapaDeCalor(vendas) {
    const matriz = Array.from({ length: 7 }, () => new Array(12).fill(0));
    vendas.forEach((p) => { matriz[(p.data.getDay() + 6) % 7][Math.floor(p.hora / 2)]++; });
    return matriz;
  }

  // Feed "ao vivo": eventos derivados dos pedidos mais recentes de hoje.
  function atividadeRecente(limite = 7) {
    // Cada pedido de hoje gera a sua "linha do tempo": criado → saiu para entrega
    // → entregue (ou cancelado), coerente com o status atual dele. Depois junto
    // tudo, ordeno do mais novo ao mais antigo e pego os primeiros.
    const eventos = [];
    for (const p of POR_DIA[ULTIMO_DIA]) {
      eventos.push({ tipo: p.novoCliente ? 'cliente' : 'pedido', pedido: p, minuto: p.minutos });
      if (p.status === 'Cancelado') eventos.push({ tipo: 'cancelado', pedido: p, minuto: p.minutos + 5 + (p.numero % 15) });
      if (p.status === 'Em rota' || p.status === 'Entregue') eventos.push({ tipo: 'rota', pedido: p, minuto: p.minutos + 45 + (p.numero % 15) });
      if (p.status === 'Entregue') eventos.push({ tipo: 'entregue', pedido: p, minuto: p.minutos + 150 + (p.numero % 90) });
    }
    return eventos
      .filter((e) => e.minuto <= MINUTO_AGORA)
      .sort((a, b) => b.minuto - a.minuto)
      .slice(0, limite)
      .map((e) => ({ ...e, minutosAtras: MINUTO_AGORA - e.minuto }));
  }

  /* ---------- 7. Formatação compartilhada ----------
     Criar Intl.NumberFormat é caro: crio uma vez e reutilizo em tudo. */
  const Formato = {
    moeda: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    moedaInteira: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
    moedaCompacta: new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
    }),
    inteiro: new Intl.NumberFormat('pt-BR'),
    // signDisplay 'exceptZero' põe "+" nos positivos: o sinal está no TEXTO, não só na cor.
    percentual: new Intl.NumberFormat('pt-BR', {
      style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero',
    }),
    porcento: new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 }),
    data: (d) => d.toLocaleDateString('pt-BR'),
    diaMes: (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').replace(' de ', ' '),
    mesAno: (d) => d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').replace(' de ', '/'),
    hora: (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    relativo: (min) => (min < 1 ? 'agora' : min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)} h`),
  };

  globalThis.Formato = Formato;
  globalThis.Dados = {
    AGORA,
    CATEGORIAS,
    totalPedidos: PEDIDOS.length,
    totalClientes: CLIENTES.length,
    analisar,
    atividadeRecente,
    dataDoDia,
    ehVenda,
  };
})();
