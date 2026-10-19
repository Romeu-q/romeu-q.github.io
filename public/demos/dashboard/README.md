# Sabiá Analytics — painel de vendas (demo)

## Decisões de design (consultadas no banco UI/UX Pro Max do projeto)

| Item | Escolha | De onde veio |
| --- | --- | --- |
| Estilo | **Data-Dense Dashboard** + **Executive Dashboard** (KPIs grandes com contagem animada e sparklines), em grade *bento* | `styles.csv` nº 28 e 30, `products.csv` → E-commerce = "Sales Intelligence Dashboard" |
| Tema | Escuro como padrão (`#09090b`), claro completo; segue `prefers-color-scheme` e lembra a escolha | `styles.csv` nº 7 (Dark Mode), regra de AA nos dois temas |
| Cor | Um acento só: índigo/violeta (`#7c6cff` no escuro, `#5b4fe8` no claro); verde/vermelho só para variação | `colors.csv` "Micro SaaS" (#6366F1 + verde) e "Financial Dashboard" (verde para positivo) |
| Tipografia | **Inter** (400–700, números tabulares) + JetBrains Mono só no nº do pedido | `typography.csv` nº 5 "Minimal Swiss": dashboards e painéis administrativos |
| Gráficos | Tendência → área com gradiente e linha tracejada do período anterior; parte do todo → rosca com no máximo 6 fatias e legenda com %; intensidade → mapa de calor com legenda | `charts.csv` nº 1, 3 e 5 |
| Tabela | Cartões no celular, rolagem no próprio contêiner no desktop | `ux-guidelines.csv` nº 71 |

Regras seguidas:

- Contraste de no mínimo 4,5:1 nos dois temas. Os valores estão anotados nas variáveis de `style.css`.
- Alvos de toque de 44 px quando o ponteiro é o dedo (`pointer: coarse`).
- Anel de foco visível (`:focus-visible`).
- A variação aparece com seta e sinal no texto, nunca só com cor.
- Ícones SVG no estilo Lucide, sem emoji.
- Os gráficos de canvas têm alternativa em texto: `aria-label` com um resumo, uma tabela "Ver dados em tabela" e a legenda da rosca com os valores.

## O que a demo mostra

Painel de um e-commerce fictício de alimentos artesanais (cafés, queijos, doces...). É feito com **HTML, CSS e JavaScript puros**, sem framework e sem build. O Chart.js vem de CDN em versão fixada (4.4.1).

- **Dados reproduzíveis.** `data.js` gera cerca de 21 mil pedidos em 24 meses com um gerador pseudoaleatório com semente (mulberry32). O movimento tem picos no almoço e à noite, mais vendas no fim de semana, crescimento ao longo do tempo e alta no Natal. Todos os números da tela são calculados a partir desse array.
- **Comparação justa.** O "período anterior" de 12 meses volta 364 dias (52 semanas exatas), então sexta é comparada com sexta.
- **Períodos 7d / 30d / 12m** em um controle segmentado com pílula deslizante:
  - um esqueleto com brilho aparece enquanto o período "carrega";
  - os números andam do valor antigo para o novo;
  - os gráficos animam a transição.
- **KPIs**: contagem animada, selo de variação (seta + %) e minigráfico em SVG puro. Em séries longas, o minigráfico usa média móvel para mostrar a tendência.
- **Gráfico de receita**: área com gradiente, linha tracejada do período anterior, linha-guia e dica em HTML que mostra o valor atual, o anterior e a variação. Dá para trocar entre Receita e Pedidos.
- **Rosca de categorias**: passar o mouse ou focar com o teclado na legenda destaca a fatia. Embaixo aparece a categoria que mais cresceu.
- **Também no painel**:
  - ranking de produtos com barras;
  - mapa de calor dia × horário com o horário de pico;
  - feed de atividade coerente com o status de cada pedido.
- **Tabela de pedidos**:
  - busca com debounce que ignora acentos ("joao" acha "João") e realça o trecho encontrado;
  - chips de status com contagem;
  - ordenação acessível (`aria-sort`, botões no cabeçalho, seletor no celular);
  - paginação com reticências e estado vazio.
- **Exportar CSV**: gera um arquivo com as linhas filtradas, de todas as páginas, via `Blob`. Usa `;` e BOM UTF-8 para o Excel em português abrir certo. Uma notificação (toast) confirma o download.
- **Paleta de comandos (Ctrl/⌘ + K)**: navegar entre seções, trocar período e tema, exportar e buscar pedidos. Feita com `<dialog>` e o padrão combobox/listbox (`aria-activedescendant`).
- **Menu lateral**:
  - no desktop, recolhe para só ícones (a escolha fica salva);
  - o indicador desliza até a seção visível (scrollspy);
  - no celular, vira uma gaveta com efeito de mola (`linear()`), `inert` no conteúdo atrás, Esc para fechar e foco devolvido ao botão.

## Movimento

- Só anima `transform` e `opacity`.
- Micro-interações levam de 150 a 300 ms, com curva *ease-out*.
- Ao carregar, os cards entram escalonados.
- Com `prefers-reduced-motion`, tudo fica instantâneo: CSS, contadores, esqueleto, rolagem suave e as animações do Chart.js.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| `index.html` | Estrutura, landmarks, sprite de ícones e paleta de comandos |
| `style.css` | Tokens dos dois temas, layout bento, componentes, responsivo e movimento reduzido |
| `data.js` | Loja fictícia e agregações (sem DOM) |
| `ui.js` | Peças reaproveitáveis: contador animado, toasts, tema, menu, controle segmentado e sparklines |
| `charts.js` | Gráfico de área e rosca (Chart.js), com cores lidas das variáveis CSS |
| `table.js` | Tabela: busca, filtros, ordenação, paginação e CSV |
| `palette.js` | Paleta de comandos |
| `app.js` | Estado e ligação entre os módulos (fluxo em uma direção: estado → dados → tela) |

## Como rodar

Abra `index.html` no navegador. É preciso internet para carregar o Chart.js e a fonte. Se preferir um servidor local, rode na pasta `demos/dashboard`:

```
npx http-server -p 8772
```

---

Demo feita por Romeu · dados fictícios.
