/* ==========================================================================
   cart.js — estado do carrinho (não toca no DOM).

   Regras de negócio:
   - Cada pack é um bem DIGITAL: comprar o mesmo arquivo duas vezes não faz
     sentido. Por isso o carrinho guarda só uma lista de ids (sem
     "quantidade") e `adicionar` ignora duplicados.
   - Preços em centavos (inteiros); o arredondamento só acontece no desconto.
   - Persistência em localStorage protegida por try/catch: em modo privado ou
     com storage bloqueado o acesso LANÇA erro, e a loja precisa continuar
     funcionando só em memória.

   Padrão observador: a UI chama `Carrinho.assinar(fn)` e redesenha quando o
   estado muda. O carrinho não sabe que a interface existe — dá para testar
   esta lógica sozinha, sem navegador.
   ========================================================================== */

const Carrinho = (() => {
  const CHAVE = 'pixel-shop:carrinho:v2';
  // Cupons fictícios: código -> fração de desconto.
  const CUPONS = { PIXEL10: 0.1 };

  let ids = [];
  let cupom = null;
  const ouvintes = [];

  const notificar = (motivo) => ouvintes.forEach((fn) => fn(motivo));

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ ids, cupom }));
    } catch (erro) {
      /* sem storage: segue em memória */
    }
  }

  function carregar() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (!dados) return;
      // Nunca confie no que está salvo: valida cada id contra o catálogo
      // atual (um pack pode ter saído da loja) e remove duplicados.
      if (Array.isArray(dados.ids)) ids = [...new Set(dados.ids)].filter((id) => buscarProduto(id));
      if (typeof dados.cupom === 'string' && CUPONS[dados.cupom]) cupom = dados.cupom;
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
    tem: (id) => ids.includes(id),
    quantidade: () => ids.length,
    adicionar(id) {
      if (!buscarProduto(id) || ids.includes(id)) return false;
      ids.push(id);
      salvar();
      notificar('adicionar');
      return true;
    },
    remover(id) {
      ids = ids.filter((i) => i !== id);
      if (ids.length === 0) cupom = null; // carrinho vazio não "guarda" cupom
      salvar();
      notificar('remover');
    },
    limpar() {
      ids = [];
      cupom = null;
      salvar();
      notificar('limpar');
    },
    /** Aceita minúsculas e espaços. Retorna true se o cupom existe. */
    aplicarCupom(codigo) {
      const normalizado = String(codigo).trim().toUpperCase();
      if (!CUPONS[normalizado]) return false;
      cupom = normalizado;
      salvar();
      notificar('cupom');
      return true;
    },
    removerCupom() {
      cupom = null;
      salvar();
      notificar('cupom');
    },
    /** Tudo que a UI precisa mostrar, em centavos. */
    resumo() {
      const itens = ids.map(buscarProduto);
      const subtotal = itens.reduce((soma, p) => soma + p.preco, 0);
      const desconto = cupom ? Math.round(subtotal * CUPONS[cupom]) : 0;
      return { itens, subtotal, desconto, total: subtotal - desconto, cupom, percentual: cupom ? CUPONS[cupom] * 100 : 0 };
    },
  };
})();
