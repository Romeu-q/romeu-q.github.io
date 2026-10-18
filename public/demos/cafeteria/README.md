# Café Sertão — demo de landing page

Landing page de uma cafeteria **fictícia** de Feira de Santana - BA, com cardápio filtrável e carrinho que envia o pedido pelo WhatsApp. HTML, CSS e JavaScript puros: sem framework e sem build.

## O que esta demo mostra

- **Componentes simples**: cards, chips, gaveta do carrinho, todos gerados por funções `render*()` pequenas a partir de dados (`data.js`).
- **Estado e localStorage**: um objeto `estado` é a fonte da verdade; o carrinho é salvo como `{ id: quantidade }` com `try/catch` e validado ao carregar.
- **Filtro e busca**: categoria + texto combinados, ignorando acentos e maiúsculas (`normalize('NFD')`).
- **Pedido no WhatsApp**: mensagem montada em texto e enviada via `wa.me` com `encodeURIComponent`.
- **Acessibilidade**: landmarks semânticos, labels, foco visível, gaveta com `aria-modal`, focus trap, `Esc` para fechar, devolução do foco, `aria-live`, contraste AA e `prefers-reduced-motion`.
- **Responsivo (mobile-first)**: CSS base para celular, `@media (min-width)` para ampliar, grade com `auto-fill/minmax`, sem rolagem horizontal a 320px.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura semântica da página |
| `style.css` | Visual, variáveis de cor, responsividade |
| `data.js` | Cardápio de exemplo (mock) |
| `app.js` | Estado, filtros, carrinho, persistência, WhatsApp |

## Como rodar

Abra `index.html` no navegador, ou sirva a pasta:

```
npx http-server demos/cafeteria -p 8771
```

Para usar com um número real, troque `WHATSAPP_NUMBER` no topo de `app.js` (formato `55` + DDD + número).
