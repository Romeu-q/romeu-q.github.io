# Portfólio do Romeu

Site pessoal de **Alisson Romeu Ramos Queiroz (Romeu)**: dev de jogos (Godot 4), web e desktop, e pixel artist. Feira de Santana - BA.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion. Visual: pixel art com tema escuro e botões no estilo dos menus de Pokémon, com o design system definido via UI/UX Pro Max. A estrutura (`components.json`, alias `@/`, `cn()`) é compatível com componentes da 21st.dev.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:5173. Para gerar a versão final: `npm run build` (sai em `dist/`), e `npm run preview` para conferir.

## Estrutura

```
src/
  App.tsx                  ordem das seções
  index.css                tema: cores (@theme), botão Pokémon, caixa de diálogo, vidro escuro
  data/projects.ts         ← TODOS os textos/links dos projetos e seus dados
  data/playlist.ts         ← músicas lo-fi (CC0)
  components/              Header, Hero, Reel, Projects, ProjectModal, About, Footer, NightSky, MusicPlayer
  components/ui/           PokeButton, Reveal (animação ao rolar)
  hooks/useMusicPlayer.ts  lógica do player (fade, playlist, localStorage)
public/
  assets/img/pixel/        ícones, mascote (PixelLab), camadas da cena noturna
  assets/img/thumbs/       miniaturas dos cards
  assets/img/verity/       GIFs e print do Verity
  assets/music/            faixas lo-fi (veja LEIA-ME.md lá dentro)
  assets/cv/               coloque aqui curriculo-romeu.pdf
  demos/                   3 sites de demonstração em HTML/CSS/JS puros (cada um com README)
tools/                     gerador de sprites pixel (ASCII/código → SVG)
.github/workflows/         deploy automático no GitHub Pages
```

## Como editar

- **Projetos, links e reel:** `src/data/projects.ts`. Link vazio = botão escondido. `featured: true` vira o card grande; `demo: true` vai para "Sites de demonstração". Cada projeto abre direto em `#projeto/<id>`.
- **Texto "Oi!":** `src/components/About.tsx`.
- **Cores e estilo dos botões:** `src/index.css`.
- **Música:** `public/assets/music/LEIA-ME.md`. São 4 faixas lo-fi CC0 do HoliznaCC0, e você baixa os MP3 com os nomes indicados. O player começa desligado, sem pop-up, e entra com fade suave em volume baixo.
- **Sprites:** `node tools/pixel2svg.mjs` (veja `tools/README.md`).

Ver tudo que falta preencher:

```bash
grep -rn "TODO" src public/assets index.html
```

## Publicar no GitHub Pages

1. Crie o repositório **`romeu-q.github.io`** (assim o endereço fica `https://romeu-q.github.io/`).
2. Envie o código:
   ```bash
   git init
   git add .
   git commit -m "Portfólio"
   git branch -M main
   git remote add origin https://github.com/Romeu-q/romeu-q.github.io.git
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Source: GitHub Actions**. A cada push na `main`, o workflow `.github/workflows/deploy.yml` faz o build e publica sozinho.
4. Se o endereço for outro, ajuste `canonical`, `og:url` e `og:image` no `index.html`. Os caminhos do site são relativos (`base: "./"`), então ele funciona em qualquer subpasta.

## Componentes da 21st.dev (opcional)

O MCP **21st.dev Magic** precisa da sua chave de API, e é **você** quem cola a chave. Pegue em https://21st.dev/magic/console e rode no terminal:

```bash
claude mcp add 21st-dev-magic --scope user --env API_KEY=SUA_CHAVE -- npx -y @21st-dev/magic@latest
```

Reinicie o Claude Code e peça, por exemplo: *"use o 21st.dev para criar um carrossel de prints para o Verity"*.
