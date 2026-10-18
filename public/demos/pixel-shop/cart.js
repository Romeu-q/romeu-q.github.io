/* ==========================================================================
   cart.js — estado do carrinho (sem tocar no DOM).

   Regras de negócio:
   - Cada pack é um bem DIGITAL: comprar duas vezes o mesmo arquivo não faz
     sentido, então a quantidade é sempre 1. Por isso o carrinho guarda só uma
     lista de ids (sem campo "quantidade") e `adicionar` ignora duplicados.
   - Preços em centavos (inteiros); o arredondamento acontece só no desconto.
   - Persistência em localStorage, protegida com try/catch: o acesso pode
     lançar erro (modo privado, storage cheio ou bloqueado) e a loja deve
     continuar funcionando só em memória.

   Padrão usado: o módulo expõe `assinar(fn)`; a UI se inscreve e redesenha
   quando o estado muda. Assim o carrinho não conhece a interface.
   ========================================================================== */

const Carrinho = (() => {
  const CHAVE = 'pixel-shop:carrinho:v1';
  // Cupons fictícios: código -> fração de desconto.
  const CUPONS = { PIXEL10: 0.1 };

  let ids = [];
  let cupom = null; // código do cupom aplicado (string) ou null
  const ouvintes = [];

  function avisar() {
    ouvintes.forEach((fn) => fn());
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ ids, cupom }));
    } catch (erro) {
      // Sem storage: segue só em memória.
    }
  }

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return;
      const dados = JSON.parse(bruto);
      // Nunca confie cegamente no que está salvo: valida cada id contra o
      // catálogo atual (um pack pode ter sido removido) e tira duplicados.
      if (Array.isArray(dados.ids)) {
        ids = [...new Set(dados.ids)].filter((id) => buscarProduto(id));
      }
      if (typeof dados.cupom === 'string' && CUPONS[dados.cupom]) {
        cupom = dados.cupom;
      }
    } catch (erro) {
      ids = [];
      cupom = null;
    }
  }

  carregar();

  return {
    assinar(fn) {
      ouvintes.push(fn);
    },
    tem(id) {
      return ids.includes(id);
    },
    quantidade() {
      return ids.length;
    },
    adicionar(id) {
      if (!buscarProduto(id) || ids.includes(id)) return false;
      ids.push(id);
      salvar();
      avisar();
      return true;
    },
    remover(id) {
      ids = ids.filter((i) => i !== id);
      salvar();
      avisar();
    },
    limpar() {
      ids = [];
      cupom = null;
      salvar();
      avisar();
    },
    /** Retorna true se o cupom existe (e o aplica). Aceita minúsculas e espaços. */
    aplicarCupom(codigo) {
      const normalizado = String(codigo).trim().toUpperCase();
      if (!CUPONS[normalizado]) return false;
      cupom = normalizado;
      salvar();
      avisar();
      return true;
    },
    removerCupom() {
      cupom = null;
      salvar();
      avisar();
    },
    /** Calcula tudo que a UI precisa mostrar, em centavos. */
    resumo() {
      const itens = ids.map(buscarProduto);
      const subtotal = itens.reduce((soma, p) => soma + p.preco, 0);
      const desconto = cupom ? Math.round(subtotal * CUPONS[cupom]) : 0;
      return { itens, subtotal, desconto, total: subtotal - desconto, cupom };
    },
  };
})();
