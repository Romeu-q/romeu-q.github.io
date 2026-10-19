# Café Sertão — landing page de cafeteria de especialidade

## Sistema de design (escolhido no banco UI/UX Pro Max)

| Decisão | Escolha | De onde veio |
|---|---|---|
| Produto | **Coffee Shop** (`products.csv` #67): "Minimalism + Organic Biophilic", padrão *Hero-Centric + Conversion*, foco em cardápio, pedido, localização e história/origem | `products.csv` |
| Estilo | **Nature Distilled** (`styles.csv` #61): tons de terra, terracota, creme, textura de grão, parallax sutil, easing natural (ease-out) + **Minimalism** (muito respiro) | `styles.csv` |
| Paleta | Base "Coffee Shop" (`colors.csv` #67: marrom café + creme + acento quente), escurecida para passar no contraste | `colors.csv` |
| Fontes | **Restaurant Menu** (`typography.csv` #33): *Playfair Display* (títulos, itálico para ênfase) + *Karla* (texto) | `typography.csv` |
| Regras de UX | `ux-guidelines.csv`: alvos ≥ 44px, contraste ≥ 4.5:1, foco visível, 150–300ms em micro-interações, só `transform`/`opacity`, `prefers-reduced-motion`, ease-out para entrar / ease-in para sair, parallax respeitando movimento reduzido | `ux-guidelines.csv` |

**Paleta final** (contraste medido com a fórmula WCAG):

| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `--creme` | `#f4eee3` | fundo | — |
| `--tinta` | `#21150e` | texto principal | 15.4:1 no creme |
| `--tinta-2` | `#5a4535` | texto secundário | 7.8:1 no creme |
| `--terra` | `#a3462a` | acento, botões, sobretítulos | 5.3:1 no creme · texto claro sobre ele 5.8:1 |
| `--espresso` | `#1c120c` | seções escuras | creme sobre ele 14.9:1 |
| `--terra-clara` | `#e8a985` | ênfase sobre fundo escuro | 9.2:1 no espresso |

Sem emojis como ícone: todos os ícones são SVG inline (traço no estilo Lucide) num único sprite `<symbol>`.

---

Landing page de uma cafeteria **fictícia** de Feira de Santana - BA: hero com foto grande, letreiro de origens, cafés da casa, cardápio com filtro e busca, carrinho e pedido pelo WhatsApp. **HTML, CSS e JavaScript puros**, sem framework, sem build e sem bibliotecas (nem de animação).

## O que esta demo mostra

**Interface e conteúdo**
- Hero em tela cheia com parallax, título com entrada em máscara e status **"Aberto agora / Fechado"** ao vivo.
- Letreiro (marquee) com as origens dos grãos, com botão de pausa (WCAG 2.2.2) e versão estática para quem pede menos movimento.
- "Assinaturas da casa": três cards editoriais com o do meio desalinhado de propósito.
- Cardápio com **filtro por categoria + busca** (ignora acentos: "pao" acha "Pão"), contagem por categoria e estado vazio.
- História, faixa "Do grão à xícara" com parallax, depoimentos, galeria em bento grid, horários (dia de hoje destacado) e rodapé com créditos das fotos.

**Carrinho e pedido**
- Carrinho salvo no `localStorage` como `{ id: quantidade }` (com `try/catch` e validação ao carregar).
- Gaveta com `<dialog>` nativo + `showModal()`: foco preso, `Esc`, fundo inerte, foco devolvido a quem abriu.
- Formulário com Retirar/Entrega (o campo de endereço só aparece na entrega), nome obrigatório, observações e erros ligados ao campo por `aria-describedby`.
- "Pedir no WhatsApp": mensagem montada em texto e enviada para `wa.me` com `encodeURIComponent`. O número (`WHATSAPP_NUMBER`) é fictício.
- Barra fixa "Ver pedido" no celular.

**Movimento (sempre com propósito)**
- *Fly-to-cart*: a miniatura da foto voa em arco até o carrinho (Web Animations API), e o contador dá um "pulo".
- Toast "item no pedido" (`role="status"`, o leitor de tela anuncia sem interromper) e botão que vira "Adicionado" por 1,2 s.
- Gaveta com **curva de mola de verdade** feita em CSS com `linear()` (fallback em `cubic-bezier` nos navegadores antigos); a saída usa ease-in, mais rápida.
- Seções aparecem em cascata ao rolar (`IntersectionObserver`, uma vez só) e os cards entram animados ao filtrar.
- Parallax calculado dentro de `requestAnimationFrame`, só com `transform`, e só para imagens visíveis.
- Tudo respeita `prefers-reduced-motion`: sem deslocamentos, sem loop, estado final na hora.

**Acessibilidade e responsividade**
- Landmarks, link "pular para o cardápio", títulos em ordem, tabela de verdade nos horários, `alt` descritivo em português.
- Chips com `aria-pressed`, contagem do resultado em `aria-live`, foco visível em todos os controles, alvos de toque ≥ 44px.
- Mobile-first, testado de 320px a 1440px sem rolagem horizontal. Em telas de 320px o botão do card vira só ícone (o `aria-label` continua dizendo "Adicionar X").

## Decisões que valem explicar na entrevista

- **Por que sem biblioteca de animação?** Tudo que a página precisa cabe em CSS transitions + `element.animate()`. Menos peso e nenhum CDN que possa cair no dia em que alguém abrir o portfólio.
- **Por que `<dialog>`?** O navegador já resolve foco preso e fundo inerte. Escrevi só o que faltava: animação de entrada/saída (interceptando o evento `cancel` do Esc) e um ciclo de Tab extra.
- **Por que o status usa `America/Bahia`?** "Aberto agora" é sobre o relógio da loja, não do visitante. `Intl.DateTimeFormat` com `timeZone` faz a conversão. A regra fica numa função pura (`calcularStatus(dia, hora)`), fácil de testar com qualquer horário.
- **Por que guardar só `{ id: quantidade }`?** O preço e o nome vêm sempre do cardápio, então não existe carrinho com preço velho.
- **Por que `overflow: clip` na gaveta?** Com `hidden`, o foco conseguia rolar o `<dialog>` de lado e o painel "andava". `clip` não pode ser rolado.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Estrutura semântica e sprite de ícones SVG |
| `style.css` | Tokens, componentes, breakpoints e movimento reduzido |
| `data.js` | Cardápio, categorias e horários (mock) |
| `app.js` | Estado, filtros, carrinho, gaveta, WhatsApp, status e animações |
| `img/` | 17 fotos WebP do Unsplash, recortadas no tamanho de uso (cards 720×900, hero 1920×1280), todas abaixo de 200 KB |

## Como rodar

Abra `index.html` no navegador ou sirva a pasta (`npx http-server . -p 8771`). Para usar com um número real, troque `WHATSAPP_NUMBER` no topo de `app.js` (formato `55` + DDD + número).

## Créditos das fotos

Todas sob a [Unsplash License](https://unsplash.com/license) (gratuitas, nenhuma Unsplash+).

| Arquivo | Fotógrafo(a) | Link |
|---|---|---|
| `hero-latte.webp` | Maria Phoenix | https://unsplash.com/photos/f4xw98lSblg |
| `latte-art.webp` | Jonas Jacobsson | https://unsplash.com/photos/RFHFV7lVQBY |
| `espresso.webp` | Wenceslao Moya Grondona de Luca | https://unsplash.com/photos/GzwqrTKPzQA |
| `cappuccino.webp` | Hannah Reid | https://unsplash.com/photos/Xtj7o_V5p-s |
| `coado-v60.webp` | Jamie Long | https://unsplash.com/photos/9ok3UPT8UuY |
| `cold-brew.webp` | Sarah Swainson | https://unsplash.com/photos/OSLnJG62isk |
| `latte-gelado.webp` | Rob Wingate | https://unsplash.com/photos/LJPAmUnE-QM |
| `graos.webp`, `graos-card.webp` | Hannah Busing | https://unsplash.com/photos/yD_P3ON8QeU |
| `croissant.webp` | Jess Bailey | https://unsplash.com/photos/K_Fey0KMSqk |
| `bolo.webp` | Tommao Wang | https://unsplash.com/photos/NDD5Pdo4-wQ |
| `doces.webp` | Markus Winkler | https://unsplash.com/photos/oSnpMJZBqVI |
| `sanduiche.webp` | Marke | https://unsplash.com/photos/Lyt6AJZmUWs |
| `paes.webp` | Markus Spiske | https://unsplash.com/photos/q0UBzw-FKE4 |
| `pessoas.webp` | Priscilla Du Preez | https://unsplash.com/photos/g86airJZ4Gs |
| `barista-latte.webp` | Pete Willis | https://unsplash.com/photos/QfTpbOey94s |
| `salao.webp` | Brett Wharton | https://unsplash.com/photos/O1NH3Sw8u8k |

Negócio, endereço, telefone e depoimentos são fictícios. Demo feita por Romeu.
