# Pixel Shop — loja fictícia de packs de pixel art

Demo de portfólio feita por **Romeu**: uma vitrine de assets em pixel art para devs indie, com carrinho, cupom e checkout **de demonstração**. HTML, CSS e JavaScript.

## Decisões de design (base UI/UX Pro Max)

| O quê | Escolha | De onde veio |
| --- | --- | --- |
| Estilo | Interface escura moderna + acentos **Pixel Art** (estilo #52): pixel só em títulos, preços, selos, cantos serrilhados dos botões e sprites | `styles.csv` #52 + produto "Digital Products/Downloads" (#79: vitrine + prévia + preço + entrega imediata) |
| Paleta | Fundo `#0F0F23`, texto `#E2E8F0`, violeta `#7C3AED`/`#A78BFA`, CTA rosa (`#E11D48`, o tom mais escuro do `#F43F5E` da base, para o texto branco passar de 4.5:1), ouro `#FDE68A` nos preços, menta `#4ADE80` para sucesso | `colors.csv` #13 Gaming |
| Fontes | **Pixelify Sans** (só peso 400) em títulos grandes, **Silkscreen** em rótulos e preços pequenos, **Inter** no texto corrido | `typography.csv` "Pixel Retro" sugere Press Start 2P + VT323; troquei porque Press Start é largo demais e VT323 cansa em parágrafos. Os pesos maiores do Pixelify deformam o "C", e abaixo de ~20px ele perde nitidez, então o Silkscreen (grade de 8px) cuida do texto pequeno |
| Regras seguidas | contraste ≥ 4.5:1, alvos de toque ≥ 44px, anel de foco visível (ouro), ícones em SVG pixel art (nenhum emoji), `prefers-reduced-motion` respeitado em tudo | `ux-guidelines.csv`, `web-interface.csv` |

## O que tem

- **Herói com cena animada**: canvas de baixa resolução ampliado por fator **inteiro** (pixels todos iguais), céu com dithering, estrelas piscando, montanhas e morros em parallax (também seguem o mouse), cavaleiro que pula para pegar moedas (o placar sobe) e um slime perseguindo.
- **12 packs** com sprites desenhados a partir de **grades ASCII** e animados em 2–4 quadros (respiração, squash & stretch, chama, fumaça, brilho...). Um único laço `requestAnimationFrame` anima todos e só desenha os que estão visíveis.
- **Filtro por categoria com animação FLIP**, ordenação, **busca** (ignora acentos, atalho `/`) e estado vazio com um slime triste.
- **Cards** com inclinação 3D e brilho que seguem o mouse (só em dispositivos com mouse).
- **Modal do produto**: prévia grande animada, zoom 1x/2x/4x, grade de pixels, pausar/reproduzir, contador de quadros, paleta clicável (copia o hex), "o que vem no pack", licença e preço.
- **Carrinho em gaveta** com entrada em mola, remoção animada com "Desfazer", cupom **PIXEL10** (10% off) com estado de sucesso e erro, persistência em `localStorage`.
- **Checkout de demonstração** com confete de pixels e o aviso "Nada foi cobrado".
- Toasts, sprite que "voa" do card até o carrinho, contador do carrinho que pula.

## Acessibilidade

- Modal e gaveta usam `<dialog>` + `showModal()`: fundo inerte, Esc fecha. Por cima disso: foco preso no Tab, foco volta para quem abriu, rolagem do fundo travada.
- Os toasts entram no diálogo aberto; fora dele ficariam inertes para leitores de tela.
- Card inteiro clicável sem botões aninhados: o botão do título se estende sobre o card com `::after`.
- Botões de estado usam `aria-pressed`; contagem de resultados e mensagens do cupom são anunciadas (`role="status"` / `aria-live`).
- Movimento reduzido: sprites parados no quadro 0, cena estática, sem confete e sem tilt; as animações WAAPI passam a durar 0ms.

## Arquivos

```
index.html      estrutura e diálogos
css/loja.css    sistema visual (tokens no :root, mobile-first)
js/data.js      catálogo (preços em centavos)
js/sprites.js   grades ASCII, derivação de quadros, animador e ícones SVG
js/cart.js      estado do carrinho (sem DOM, padrão observador)
js/ui.js        Movimento (WAAPI + mola), Dialogo, Toast, confete, tilt
js/hero.js      cena em parallax do topo
js/app.js       vitrine, FLIP, modal, gaveta e checkout
```

