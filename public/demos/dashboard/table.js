/* ==========================================================================
   table.js — tabela de pedidos: busca, ordenação e paginação
   Guarda seu próprio estado (busca, ordem, página) e redesenha o <tbody>
   sempre pelo mesmo caminho: filtrar → ordenar → paginar → desenhar.
   Uso createElement/textContent (e não innerHTML) para nunca interpretar
   texto de dados como HTML — hábito que evita XSS.
   ========================================================================== */
(function () {
  'use strict';

  const TAMANHO_PAGINA = 10;
  const ATRASO_BUSCA_MS = 250;

  // Definição das colunas em um só lugar: cabeçalho, ordenação e células saem daqui.
  const COLUNAS = [
    { chave: 'numero',    rotulo: 'Pedido',    valorOrdenacao: (p) => p.numero },
    { chave: 'data',      rotulo: 'Data',      valorOrdenacao: (p) => p.dia, primeiraDirecao: 'desc' },
    { chave: 'cliente',   rotulo: 'Cliente',   valorOrdenacao: (p) => p.cliente },
    { chave: 'categoria', rotulo: 'Categoria', valorOrdenacao: (p) => p.categoria },
    { chave: 'status',    rotulo: 'Status',    valorOrdenacao: (p) => p.status },
    { chave: 'valor',     rotulo: 'Valor',     valorOrdenacao: (p) => p.valor, numerica: true, primeiraDirecao: 'desc' },
  ];

  const estado = {
    todos: [],                                 // pedidos do período selecionado
    busca: '',
    ordem: { chave: 'data', direcao: 'desc' }, // mais recentes primeiro
    pagina: 1,
  };

  const el = {};

  /* Debounce: só executa a função depois que o usuário PARA de digitar por X ms.
     Sem isso, cada tecla refiltraria e redesenharia a tabela inteira. */
  function debounce(funcao, atraso) {
    let temporizador;
    return (...args) => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => funcao(...args), atraso);
    };
  }

  // Busca sem diferenciar maiúsculas nem acentos ("joao" encontra "João").
  function normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  /* ---------- Pipeline de dados ---------- */
  function filtrar() {
    if (!estado.busca) return estado.todos;
    return estado.todos.filter((p) => normalizar(`${p.numero} ${p.cliente} ${p.categoria} ${p.status}`).includes(estado.busca));
  }

  function ordenar(lista) {
    const coluna = COLUNAS.find((c) => c.chave === estado.ordem.chave);
    const sentido = estado.ordem.direcao === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => { // cópia: sort() altera o array original
      const va = coluna.valorOrdenacao(a);
      const vb = coluna.valorOrdenacao(b);
      // localeCompare com 'pt-BR' ordena acentos corretamente (Álvaro junto do A).
      const comparacao = typeof va === 'string' ? va.localeCompare(vb, 'pt-BR') : va - vb;
      return (comparacao || a.numero - b.numero) * sentido; // desempate estável pelo nº do pedido
    });
  }

  /* ---------- Desenho ---------- */
  function criarCelula(texto, classe) {
    const td = document.createElement('td');
    td.textContent = texto;
    if (classe) td.className = classe;
    return td;
  }

  function criarLinha(p) {
    const tr = document.createElement('tr');
    tr.append(criarCelula(`#${p.numero}`));
    tr.append(criarCelula(Formato.data(p.data)));
    tr.append(criarCelula(p.cliente));
    tr.append(criarCelula(p.categoria));

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge badge--${normalizar(p.status)}`;
    badge.textContent = p.status; // o texto garante que a informação não depende só da cor
    tdStatus.append(badge);
    tr.append(tdStatus);

    tr.append(criarCelula(Formato.moeda.format(p.valor), 'num'));
    return tr;
  }

  function desenharCabecalho() {
    COLUNAS.forEach((coluna) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.dataset.chave = coluna.chave;
      if (coluna.numerica) th.classList.add('num');

      // <button> dentro do <th>: já é focável e ativa com Enter/Espaço, sem JS extra de teclado.
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.append(coluna.rotulo);
      const seta = document.createElement('span');
      seta.className = 'ordem-seta';
      seta.setAttribute('aria-hidden', 'true');
      botao.append(seta);
      botao.addEventListener('click', () => alternarOrdem(coluna));

      th.append(botao);
      el.cabecalho.append(th);
    });
  }

  function atualizarIndicadoresDeOrdem() {
    el.cabecalho.querySelectorAll('th').forEach((th) => {
      const ativa = th.dataset.chave === estado.ordem.chave;
      // aria-sort é o que o leitor de tela anuncia ("ordenado de forma crescente").
      th.setAttribute('aria-sort', ativa ? (estado.ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none');
      th.querySelector('.ordem-seta').textContent = ativa ? (estado.ordem.direcao === 'asc' ? '▲' : '▼') : '↕';
    });
  }

  function desenhar() {
    const filtrados = filtrar();
    const ordenados = ordenar(filtrados);
    const totalPaginas = Math.max(1, Math.ceil(ordenados.length / TAMANHO_PAGINA));
    estado.pagina = Math.min(estado.pagina, totalPaginas); // ex.: busca reduziu o nº de páginas
    const inicio = (estado.pagina - 1) * TAMANHO_PAGINA;
    const pagina = ordenados.slice(inicio, inicio + TAMANHO_PAGINA);

    el.corpo.replaceChildren();
    if (pagina.length === 0) {
      const tr = document.createElement('tr');
      const td = criarCelula('Nenhum pedido encontrado.', 'tabela__vazio');
      td.colSpan = COLUNAS.length;
      tr.append(td);
      el.corpo.append(tr);
    } else {
      el.corpo.append(...pagina.map(criarLinha));
    }

    el.resumo.textContent = ordenados.length
      ? `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${Formato.inteiro.format(ordenados.length)} pedidos`
      : 'Nenhum pedido';
    el.paginaAtual.textContent = `Página ${estado.pagina} de ${totalPaginas}`;
    el.anterior.disabled = estado.pagina <= 1;
    el.proxima.disabled = estado.pagina >= totalPaginas;
    atualizarIndicadoresDeOrdem();
  }

  /* ---------- Interações ---------- */
  function alternarOrdem(coluna) {
    if (estado.ordem.chave === coluna.chave) {
      estado.ordem.direcao = estado.ordem.direcao === 'asc' ? 'desc' : 'asc';
    } else {
      // Primeiro clique: números/datas começam do maior/mais recente; textos de A a Z.
      estado.ordem = { chave: coluna.chave, direcao: coluna.primeiraDirecao || 'asc' };
    }
    estado.pagina = 1;
    desenhar();
  }

  const Tabela = {
    iniciar() {
      el.cabecalho = document.getElementById('tabela-cabecalho');
      el.corpo = document.getElementById('tabela-corpo');
      el.resumo = document.getElementById('paginacao-resumo');
      el.paginaAtual = document.getElementById('pagina-atual');
      el.anterior = document.getElementById('pagina-anterior');
      el.proxima = document.getElementById('pagina-proxima');
      const busca = document.getElementById('busca-pedidos');

      desenharCabecalho();

      busca.addEventListener('input', debounce(() => {
        estado.busca = normalizar(busca.value.trim());
        estado.pagina = 1;
        desenhar();
      }, ATRASO_BUSCA_MS));

      el.anterior.addEventListener('click', () => { estado.pagina--; desenhar(); });
      el.proxima.addEventListener('click', () => { estado.pagina++; desenhar(); });
    },

    // Chamado pelo app quando o período muda: troca os dados e volta à página 1.
    definirPedidos(pedidos) {
      estado.todos = pedidos;
      estado.pagina = 1;
      desenhar();
    },
  };

  globalThis.Tabela = Tabela;
})();
