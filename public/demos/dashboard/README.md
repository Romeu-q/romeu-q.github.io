# Painel de Vendas (demo)

Painel administrativo de uma loja fictícia ("Loja Aurora"), feito com HTML, CSS e JavaScript puros (sem framework e sem build). Só o Chart.js vem de CDN, em versão fixada (4.4.1).

## O que esta demo mostra

- **Agregação de dados:** `data.js` gera ~650 pedidos (24 meses) com um gerador pseudoaleatório com semente (mulberry32), então a demo é sempre igual. KPIs, gráficos e tabela são calculados a partir do array de pedidos, nada é número fixo.
- **Chart.js:** gráfico de linha (faturamento), barras horizontais (por categoria) e barras (pedidos por dia da semana), recoloridos ao trocar o tema.
- **Busca, ordenação e paginação:** busca com debounce e sem diferenciar acentos, ordenação por cabeçalho (`aria-sort`), 10 itens por página.
- **Tema claro/escuro:** variáveis CSS em `:root` e `[data-theme="dark"]`, valor inicial vindo de `prefers-color-scheme`, escolha salva em `localStorage` (com `try/catch`).
- **Acessibilidade e responsividade:** landmarks, controles com rótulo, foco visível, contraste AA, resumos em `aria-label` nos gráficos, `prefers-reduced-motion`, menu lateral que vira gaveta no celular e tabela que rola dentro do próprio contêiner.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | Estrutura e landmarks |
| `style.css` | Layout, temas (variáveis CSS) e responsividade |
| `data.js` | Dados fictícios e funções de agregação (sem DOM) |
| `charts.js` | Gráficos com Chart.js |
| `table.js` | Tabela: busca, ordenação, paginação |
| `app.js` | Estado, tema, menu e ligação entre os módulos |

## Como rodar

Abra `index.html` no navegador (precisa de internet para carregar o Chart.js). Se preferir um servidor local, na pasta `demos/dashboard`:

```
npx http-server -p 8772
```

e acesse `http://localhost:8772`.
