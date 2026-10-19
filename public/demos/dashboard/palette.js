/* ==========================================================================
   palette.js — paleta de comandos (Ctrl/Cmd + K)
   --------------------------------------------------------------------------
   Padrão de produtos como Linear e Vercel: um campo só para navegar, trocar
   período/tema e exportar, sem tirar a mão do teclado.
   Acessibilidade: <dialog> modal (foco preso + Esc) e o padrão "combobox +
   listbox" com aria-activedescendant: o foco fica no campo e o leitor de tela
   anuncia a opção destacada pelas setas.
   ========================================================================== */
(function () {
  'use strict';

  const { h, icone } = UI;
  const dialogo = document.getElementById('paleta');
  const campo = document.getElementById('paleta-campo');
  const lista = document.getElementById('paleta-lista');
  const gatilho = document.getElementById('abrir-paleta');

  const ehMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.getElementById('atalho-paleta').textContent = ehMac ? '⌘ K' : 'Ctrl K';

  let comandos = [];      // registrados pelo app.js (ele sabe o que cada um faz)
  let visiveis = [];
  let indice = 0;
  let focoAnterior = null;

  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Pontuação simples: começa com > contém > letras na ordem ("rct" acha "Receita").
  function pontuar(texto, consulta) {
    if (!consulta) return 1;
    const t = normalizar(texto);
    if (t.startsWith(consulta)) return 3;
    if (t.includes(consulta)) return 2;
    let j = 0;
    for (const letra of t) if (letra === consulta[j]) j++;
    return j === consulta.length ? 1 : 0;
  }

  function filtrar(consulta) {
    const q = normalizar(consulta.trim());
    const achados = comandos
      .map((c) => ({ c, nota: Math.max(pontuar(c.titulo, q), pontuar(c.palavras || '', q) && 1) }))
      .filter((x) => x.nota > 0)
      .sort((a, b) => b.nota - a.nota || comandos.indexOf(a.c) - comandos.indexOf(b.c))
      .map((x) => x.c);
    // Com texto digitado, sempre ofereço buscar esse texto nos pedidos.
    if (q) {
      achados.push({
        grupo: 'Pedidos', titulo: `Buscar “${consulta.trim()}” nos pedidos`, icone: 'search',
        executar: () => { Tabela.buscar(consulta.trim()); UI.irPara('pedidos'); },
      });
    }
    return achados;
  }

  function desenhar() {
    visiveis = filtrar(campo.value);
    indice = Math.min(indice, Math.max(0, visiveis.length - 1));
    const itens = [];
    let grupoAtual = null;
    // Com busca, a lista é ordenada por relevância e os grupos se misturam:
    // só mostro cabeçalho de grupo sem busca.
    const mostrarGrupos = !campo.value.trim();
    visiveis.forEach((c, i) => {
      if (mostrarGrupos && c.grupo !== grupoAtual) {
        grupoAtual = c.grupo;
        itens.push(h('li', { class: 'paleta__grupo', role: 'presentation', 'aria-hidden': 'true', text: c.grupo }));
      }
      const extra = typeof c.extra === 'function' ? c.extra() : c.extra;
      const li = h('li', {
        class: 'paleta__item', role: 'option', id: `cmd-${i}`, 'aria-selected': String(i === indice),
      }, icone(c.icone), h('span', { text: c.titulo }), extra ? h('small', { text: extra }) : null);
      li.addEventListener('click', () => executar(i));
      li.addEventListener('mousemove', () => { if (indice !== i) { indice = i; marcar(); } });
      itens.push(li);
    });
    if (!visiveis.length) itens.push(h('li', { class: 'paleta__vazio', role: 'presentation', text: 'Nenhum comando encontrado' }));
    lista.replaceChildren(...itens);
    marcar();
  }

  function marcar() {
    lista.querySelectorAll('[role="option"]').forEach((li) => {
      li.setAttribute('aria-selected', String(li.id === `cmd-${indice}`));
    });
    const ativo = document.getElementById(`cmd-${indice}`);
    campo.setAttribute('aria-activedescendant', ativo ? ativo.id : '');
    ativo?.scrollIntoView({ block: 'nearest' });
  }

  function executar(i) {
    const c = visiveis[i];
    if (!c) return;
    fechar(false);
    // Executa depois de fechar: comandos que mexem no foco (ir para seção) vencem.
    setTimeout(() => c.executar(), UI.semMovimento() ? 0 : 160);
  }

  function abrir() {
    if (dialogo.open) return;
    focoAnterior = document.activeElement;
    campo.value = '';
    indice = 0;
    desenhar();
    dialogo.classList.remove('fechando');
    dialogo.showModal();
    campo.focus();
  }

  function fechar(devolverFoco = true) {
    if (!dialogo.open || dialogo.classList.contains('fechando')) return;
    dialogo.classList.add('fechando');
    setTimeout(() => {
      dialogo.close();
      dialogo.classList.remove('fechando');
      if (devolverFoco) focoAnterior?.focus?.();
    }, UI.semMovimento() ? 0 : 150);
  }

  campo.addEventListener('input', () => { indice = 0; desenhar(); });
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visiveis.length) return;
      indice = (indice + (e.key === 'ArrowDown' ? 1 : -1) + visiveis.length) % visiveis.length;
      marcar();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executar(indice);
    }
  });
  // Esc dispara "cancel" no <dialog>: troco o fechamento seco pelo animado.
  dialogo.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
  // Clique fora da caixa (no backdrop) cai no próprio <dialog>.
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) fechar(); });
  gatilho.addEventListener('click', abrir);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); // Ctrl+K no navegador abre a busca da barra de endereço
      if (dialogo.open) fechar(); else abrir();
    }
  });

  globalThis.Paleta = {
    registrar(lista) { comandos = lista; },
    abrir,
    fechar,
  };
})();
