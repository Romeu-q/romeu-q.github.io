# tools/ — gerador de pixel art

Todos os SVGs pixel art do site saem daqui. **Não edite os SVGs à mão** — edite a fonte e rode:

```
node tools/pixel2svg.mjs                   # gera tudo e valida o XML
node tools/pixel2svg.mjs icon-mail icon-cv  # só alguns sprites
node tools/pixel2svg.mjs --png prev/       # + PNGs de prévia e folhas de contato (_sheet-*.png)
```

Sem npm, sem dependências (Node puro).

## Onde fica cada coisa

| Fonte | Gera |
|---|---|
| `sprites/icons.txt` | `public/assets/img/pixel/icon-*.svg` (16x16) |
| `sprites/brand.txt` | `public/assets/img/pixel/logo.svg` + `public/favicon.svg` |
| (mascote) | `mascot*.png` foram gerados no PixelLab, não por este script |
| `sprites/decor.txt` | folha, peixe, brilho, disquete, CRT, moeda |
| `scenes/decor.mjs` | nuvens (noturnas), bolha, sol, lua, vaga-lume, CD |
| `scenes/hero.mjs` | `hero-sky/far/sea/near.svg` (160x90, camadas de parallax, cena noturna) |
| `scenes/thumbs.mjs` | `public/assets/img/thumbs/*.svg` (160x100) |
| `scenes/art.mjs` | `public/assets/img/art/art-01..06.svg` (64x64, placeholders) |
| `lib/palette.mjs` | paleta oficial (char → cor) |
| `lib/canvas.mjs`, `lib/kit.mjs` | funções de desenho para as cenas |

## Sprites ASCII (`sprites/*.txt`)

Cada char do grid é um pixel, `.` = transparente. O formato completo
(`@sprite`, `@palette`, `@grid mirror outline=K`, `@layer`, `@patch`, `@motion`…)
está explicado no topo de `sprites/icons.txt`. Linhas de tamanhos diferentes dão erro.

Animações vão em `@motion` — o gerador envolve em
`@media (prefers-reduced-motion: no-preference)` automaticamente.

## Cenas (`scenes/*.mjs`)

Cada arquivo exporta uma função que retorna `[{ name, out, scale, canvas | layers }]`.
Arquivos começando com `_` são ignorados. Cores podem ter opacidade: `'#ffffff@0.5'`.
