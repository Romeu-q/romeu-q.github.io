# Pixel Shop (demo)

Loja **fictícia** de packs de pixel art para devs indie. Feita com HTML, CSS e JavaScript puros: sem frameworks e sem build. Nenhum pagamento é real.

## O que esta demo mostra

- **Canvas a partir de dados**: `sprites.js` transforma grades ASCII em pixel art num `<canvas>` de 12x12 px, ampliado com `image-rendering: pixelated`. Não há imagens externas.
- **Modal acessível**: `role="dialog"`, `aria-modal`, foco preso dentro do diálogo, fecha com Esc ou clique no fundo, e o foco volta ao botão que abriu. O resto da página fica `inert`.
- **Estado do carrinho + localStorage**: `cart.js` cuida só dos dados (ids, cupom, totais em centavos) e avisa a interface por assinatura. Quantidade é sempre 1, pois são produtos digitais. O acesso ao storage usa `try/catch`.
- **Filtro e ordenação**: categorias com `aria-pressed`, ordenação por preço, nome (com `localeCompare('pt-BR')`) e data; eventos por delegação.
- **Responsivo e acessível**: mobile-first, sem rolagem horizontal em 320px, foco visível, navegação por teclado, `prefers-reduced-motion` desliga o pisca-pisca e as scanlines.
- Preços formatados com `Intl.NumberFormat('pt-BR')`. Cupom de teste: `PIXEL10` (10% de desconto).

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | Estrutura da página, modal e gaveta |
| `style.css` | Visual retrô, bordas de pixel, layout responsivo |
| `data.js` | Catálogo de produtos (fictício) |
| `sprites.js` | Desenho dos sprites em canvas |
| `cart.js` | Estado do carrinho e persistência |
| `app.js` | Interface: vitrine, modal, gaveta, checkout fake |

## Como rodar

Basta abrir `index.html` no navegador. Se preferir um servidor local:

```
npx http-server . -p 8773
```

e acessar `http://localhost:8773`. As fontes vêm do Google Fonts; sem internet, a página usa fontes monoespaçadas do sistema.
