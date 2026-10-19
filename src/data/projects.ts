/* =====================================================================
   src/data/projects.ts — TODOS os dados editáveis do portfólio.
   - Link vazio ("") = o botão não aparece.
   - Imagens: caminhos dentro de public/ (ex.: "assets/img/projetos/x.webp").
   - A ordem do array é a ordem na página.
   - Comentários "TODO:" ficam só no código; nada com TODO aparece na tela.
   ===================================================================== */

export type Links = { demo: string; github: string; video: string; itch: string; download: string };

export type Shot = { src: string; alt: string; caption?: string; pixel?: boolean };

export type Project = {
  id: string;
  title: string;
  kind: string;
  featured?: boolean;
  demo?: boolean;
  summary: string;
  howToTest?: string; // instrução curta para quem vai avaliar
  details: string[]; // aceita HTML simples (<strong>, <em>, <code>)
  highlights: string[];
  tags: string[];
  shots: Shot[]; // a primeira é a capa do card; todas aparecem na galeria do modal
  links: Links;
};

export type Profile = {
  name: string;
  nick: string;
  city: string;
  role: string;
  links: { github: string; linkedin: string; itch: string; email: string; cv: string };
};

export type Reel = { title: string; video: string; poster: string; gif: string; alt: string };

const noLinks: Links = { demo: "", github: "", video: "", itch: "", download: "" };

/* ---------- Seus dados e redes (header, footer e "Oi!") ---------- */
export const PROFILE: Profile = {
  name: "Alisson Romeu Ramos Queiroz",
  nick: "Romeu",
  city: "Feira de Santana - BA",
  role: "Desenvolvedor web & de jogos",
  links: {
    github: "https://github.com/Romeu-q",
    linkedin: "", // TODO: "https://www.linkedin.com/in/SEU-USUARIO"
    itch: "",     // TODO: "https://SEU-USUARIO.itch.io"
    email: "alissonrrqueiroz@gmail.com",
    cv: "assets/cv/curriculo-romeu.pdf"
  }
};

/* ---------- Reel de destaque (seção abaixo do hero) ---------- */
export const REEL: Reel = {
  title: "Verity — Ato I (beta)",
  video: "", // TODO: "assets/video/verity-reel.mp4" (recomendado: < 8 MB, 720p)
  poster: "assets/img/verity/captura-viagem.webp",
  gif: "assets/img/verity/verity_grauwick.gif",
  alt: "Gameplay de Verity: Emil chega à cidade siderúrgica de Grauwick, em visão lateral, com a ambulância estacionada."
};

/* ---------- Projetos ---------- */
export const PROJECTS: Project[] = [
  {
    id: "prefiro-delivery-ia",
    title: "PrefiroDeliveryIA",
    kind: "Web full stack + IA · teste técnico",
    featured: true,
    summary:
      "Assistente para gestores de delivery, feito como teste técnico para a Prefiro Delivery. O gestor pergunta em português (\"por que minhas vendas caíram?\") e a IA responde com números reais do banco, gráficos e sugestões. Está no ar.",
    howToTest: "Abra a demo (não precisa de login), escolha uma loja e clique numa pergunta sugerida.",
    details: [
      "Desenvolvi este projeto como <strong>teste técnico para a Prefiro Delivery</strong>. O gestor conversa em linguagem natural com os dados de vendas, produtos e clientes. A IA (<strong>Google Gemini</strong>) é consultada em tempo real, mas <strong>nunca é a fonte dos números</strong>: ela escolhe, via <em>function calling</em>, quais das 11 consultas executar; o back-end roda consultas SQL fixas e parametrizadas no MySQL e devolve os números já calculados, e a IA só interpreta e recomenda.",
      "Cada resposta chega por streaming (Server-Sent Events) e passa pelo <code>NumberGuard</code>, que confere automaticamente cada número citado contra os resultados das consultas (selo \"✓ N números conferidos\"). Há 3 lojas fictícias isoladas por <code>store_id</code>, comparação entre períodos, detecção de anomalias, gráficos gerados a partir dos dados e uma ação real: criar rascunho de campanha para clientes inativos.",
      "Também cuidei da produção: Docker (FrankenPHP), deploy no Railway, rate limit por IP, fallback entre modelos, registro de tokens/custo/latência por resposta, testes automatizados e base fictícia renovada diariamente."
    ],
    highlights: [
      "Loop modelo → ferramentas → modelo (até 5 rodadas) com validação de argumentos por JSON Schema",
      "Cliente HTTP do Gemini escrito à mão (streaming via SSE, sem SDK)",
      "Front Vue 3 lendo SSE via fetch (POST), markdown sanitizado com DOMPurify, Chart.js",
      "Loja atual resolvida no servidor pela sessão — a IA nunca escolhe de qual loja lê",
      "Testes de feature e unidade (PHPUnit) para analytics, ferramentas e verificação de números"
    ],
    tags: ["PHP 8.4", "Laravel 13", "Vue 3", "MySQL 8", "Gemini", "Docker", "Tailwind"],
    shots: [
      { src: "assets/img/projetos/delivery-ia-1.webp", alt: "Resposta da IA para 'Por que minhas vendas caíram?' com gráficos de faturamento por categoria e produtos em queda, e o selo '20 números conferidos com o banco'.", caption: "Resposta real da IA com gráficos e verificação automática dos números" },
      { src: "assets/img/projetos/delivery-ia-3.webp", alt: "Análise em texto da IA: causas da queda e sugestão de ação de reativação de clientes.", caption: "Análise e sugestão de ação" },
      { src: "assets/img/projetos/delivery-ia-2.webp", alt: "Tela inicial com indicadores do mês, seletor de loja e perguntas sugeridas.", caption: "Tela inicial: indicadores do mês e perguntas sugeridas" }
    ],
    links: { ...noLinks, demo: "https://delivery-ia-production.up.railway.app", github: "https://github.com/Romeu-q/PrefiroDeliveryIA" }
  },
  {
    id: "verity",
    title: "Verity",
    kind: "Jogo autoral · Godot 4",
    featured: true,
    summary:
      "Jogo 2D de sobrevivência com foco em narrativa, feito do zero em Godot 4: programação, arte e design. A beta do Ato I é jogável do começo ao fim.",
    howToTest: "Veja o gameplay em GIF logo abaixo e as cenas na galeria.",
    details: [
      "Verity é um jogo em visão lateral, de clima melancólico, em que a história é contada pelo ambiente, pelo rádio da ambulância e pelas escolhas de quem joga. Emil atravessa uma região em guerra, da cidade siderúrgica de Grauwick até a Fundição Kessel, nove dias depois da queda de um avião.",
      "Tudo foi feito em <strong>Godot 4 / GDScript</strong>: combate com quatro armas que seguem a mecânica real de recarga (bala por bala, cápsulas ejetadas), furtividade com lanterna e agachamento, portas que abrem devagar ou são arrombadas com barulho, e uma viagem de ambulância com combustível que liga as fases."
    ],
    highlights: [
      "Sistema de fases montado com peças reutilizáveis (Bloco, Porta, Escada, Lâmpada) editáveis no Inspetor",
      "Armas como Resources: cada uma é um arquivo de dados, sem duplicar código",
      "Inimigos com estados e reação a ruído e luz; portas que cedem quando atacadas",
      "Estado do jogador (vida, munição, itens) persistido entre as fases",
      "Iluminação 2D dinâmica e cutscenes em pixel art"
    ],
    tags: ["Godot 4", "GDScript", "Game design", "Narrativa", "Pixel art"],
    shots: [
      { src: "assets/img/verity/abertura-4.webp", alt: "Cutscene em pixel art: ambulância chegando a uma cidade industrial com chaminés e refugiados na estrada.", caption: "Cutscene de abertura: chegada a Grauwick", pixel: true },
      { src: "assets/img/verity/captura-viagem.webp", alt: "Gameplay: a ambulância na estrada ao pôr do sol, com HUD de combustível e munição.", caption: "Gameplay: a viagem de ambulância entre as fases" },
      { src: "assets/img/verity/abertura-1.webp", alt: "Cutscene: silhueta de um homem segurando uma criança diante de uma cidade em chamas.", caption: "Cutscene de abertura", pixel: true },
      { src: "assets/img/verity/abertura-3.webp", alt: "Cutscene: motorista de boina e cachecol vermelho dirigindo sob chuva.", caption: "Cutscene de abertura", pixel: true },
      { src: "assets/img/verity/gameplay-grauwick.webp", alt: "Gameplay em Grauwick: prédios de tijolos, NPCs e a ambulância estacionada.", caption: "Gameplay: Grauwick", pixel: true },
      { src: "assets/img/verity/gameplay-kessel.webp", alt: "Gameplay na Fundição Kessel: interior escuro iluminado só por uma lâmpada e pela lanterna.", caption: "Gameplay: Fundição Kessel, só com a lanterna", pixel: true },
      { src: "assets/img/verity/abertura-2.webp", alt: "Cutscene: avião em chamas caindo entre montanhas.", caption: "Cutscene: a queda do avião", pixel: true }
    ],
    links: { ...noLinks, video: "", itch: "", download: "" } // TODO: itch.io / build para download / trailer
  },
  {
    id: "ritmo",
    title: "Ritmo",
    kind: "Desktop · Rust + Tauri + React",
    summary:
      "DAW (estação de áudio) baseada em patterns, com motor de áudio em tempo real escrito em Rust: step sequencer, piano roll, synth, playlist, mesa com efeitos, automação, MIDI e gravação.",
    howToTest: "Código aberto no GitHub, com README e roadmap detalhados.",
    details: [
      "Ritmo é uma <strong>estação de trabalho de áudio digital</strong> baseada em patterns: você monta batidas no step sequencer, escreve melodias no piano roll, organiza tudo numa playlist e mixa numa mesa com efeitos. Interface, nome, arte, código e sons são todos próprios.",
      "O motor de áudio é escrito em <strong>Rust</strong> e roda numa thread de tempo real que <strong>nunca aloca nem bloqueia</strong>: os comandos chegam por uma fila lock-free e os buffers substituídos voltam por outra fila para serem liberados fora dela. A interface é <strong>React + TypeScript</strong> desenhada em canvas, conectada ao núcleo via <strong>Tauri 2</strong>.",
      "A Fase 1 (MVP) está completa e a Fase 2 está em andamento: automação, MIDI, áudio na playlist e gravação já funcionam."
    ],
    highlights: [
      "Fila lock-free (rtrb) entre o núcleo e a thread de áudio; playhead e medidores por atômicos",
      "Mesmo Renderer para tocar ao vivo, rodar os testes e exportar WAV offline",
      "Synth subtrativo com osciladores anti-aliasing (polyBLEP) e filtro SVF ressonante",
      "Mesa com 16 inserts, EQ de 3 bandas, delay sincronizado ao BPM e reverb",
      "MIDI com MIDI learn, importar/exportar .mid; projeto em JSON versionado com gravação atômica"
    ],
    tags: ["Rust", "Tauri 2", "React", "TypeScript", "DSP", "Áudio em tempo real"],
    shots: [
      { src: "assets/img/ritmo/ritmo-1.webp", alt: "Ritmo em modo Pattern: step sequencer com bateria, piano roll do baixo, painel do synth e mesa de mixagem.", caption: "Step sequencer, piano roll, synth e mesa (interface real, projeto de demonstração)" },
      { src: "assets/img/ritmo/ritmo-2.webp", alt: "Ritmo em modo Song: playlist com clipes de patterns e um clipe de automação.", caption: "Modo Song: playlist com clipes e automação" },
      { src: "assets/img/ritmo/ritmo-3.webp", alt: "Visão Ambos: playlist acima do piano roll do Lead, e cadeia de delay e reverb na mesa.", caption: "Playlist + piano roll e efeitos (delay ping-pong e reverb)" },
      { src: "assets/img/thumbs/ritmo-banner.svg", alt: "Banner do Ritmo — DAW de patterns." }
    ],
    links: { ...noLinks, github: "https://github.com/Romeu-q/ritmo" }
  },
  {
    id: "thoseidles",
    title: "ThoseIdles",
    kind: "Desktop · C# / .NET",
    summary:
      "Gerenciador de múltiplas sessões de navegador isoladas numa só janela, otimizado para gastar pouca memória. Executável pronto para download no GitHub.",
    howToTest: "O README explica a arquitetura; o .exe está na página de Releases.",
    details: [
      "Aplicativo desktop que abre e gerencia <strong>quatro sessões de navegador isoladas</strong> ao mesmo tempo (cookies, Local Storage, IndexedDB e cache separados por perfil), todas continuando ativas mesmo quando só uma está em destaque ou a janela está minimizada.",
      "A decisão central de arquitetura foi usar <strong>um único ambiente WebView2 com quatro perfis nomeados</strong>: os processos de navegador, GPU e rede são compartilhados (uma cópia de cada) enquanto as sessões continuam totalmente separadas. Comparei com alternativas (4 Chromes, 4 ambientes) e medi com benchmarks salvos no repositório.",
      "É um gerenciador de sessões: não automatiza ações, não altera requisições e não contorna proteções do servidor. O código é aberto e o README documenta com quais domínios o app se comunica, onde guarda dados e como conferir o executável (SHA-256)."
    ],
    highlights: [
      "WPF + MVVM em .NET 10, publicado como .exe único (self-contained)",
      "Isolamento por perfil (StoragePartitions do Chromium) com autoteste",
      "Flags de ambiente para impedir throttling de timers em páginas fora de foco",
      "Job Object (KILL_ON_JOB_CLOSE) para nunca deixar processos órfãos",
      "Credenciais locais criptografadas com DPAPI; logs que removem tokens"
    ],
    tags: ["C#", ".NET 10", "WPF", "MVVM", "WebView2"],
    shots: [
      // TODO: troque por um print real do app aberto (assets/img/projetos/thoseidles.webp)
      { src: "assets/img/thumbs/instancer.svg", alt: "Ilustração: uma janela grande e três miniaturas de sessões lado a lado." }
    ],
    links: { ...noLinks, github: "https://github.com/Romeu-q/ThoseIdles", download: "https://github.com/Romeu-q/ThoseIdles/releases" }
  },

  /* ---------- 3 demos (pasta public/demos/) ---------- */
  {
    id: "demo-cafeteria",
    title: "Café Sertão",
    kind: "Demo · Landing page de cafeteria",
    demo: true,
    summary: "Landing page de uma torrefação baiana fictícia: hero com parallax, cardápio filtrável com busca, carrinho com animação \"voando\" até a sacola e pedido montado direto no WhatsApp.",
    howToTest: "Filtre o cardápio, adicione itens (veja a animação) e finalize o pedido no carrinho.",
    details: [
      "Landing page pensada para converter visita em pedido: fotografia em destaque, tipografia editorial (Playfair Display + Karla) e paleta creme/espresso/terracota com contraste AA medido em todos os pares de cor. O status \"Aberto agora / Fechado\" é calculado em tempo real a partir dos horários.",
      "O carrinho fica no <code>localStorage</code> e abre numa gaveta acessível (<code>&lt;dialog&gt;</code> nativo, foco preso, Esc fecha e o foco volta). O formulário valida nome, mostra endereço só para entrega e monta a mensagem do WhatsApp com <code>encodeURIComponent</code>.",
      "Animações só com CSS e a Web Animations API (sem biblioteca): item voando até o carrinho, mola na gaveta, entradas ao rolar. Tudo respeita <code>prefers-reduced-motion</code>. Fotos do Unsplash com crédito aos fotógrafos."
    ],
    highlights: ["Filtro + busca sem acento", "Fly-to-cart com Web Animations API", "Gaveta acessível com <dialog>", "Status de funcionamento em tempo real", "Responsivo de 320 a 1440px"],
    tags: ["HTML", "CSS", "JavaScript", "Web Animations API", "Acessibilidade"],
    shots: [{ src: "assets/img/projetos/cafeteria.webp", alt: "Hero do Café Sertão: foto de latte art em fundo escuro e o título 'Café do sertão, torrado devagar.'" }],
    links: { ...noLinks, demo: "demos/cafeteria/index.html", github: "https://github.com/Romeu-q/romeu-q.github.io/tree/main/public/demos/cafeteria" }
  },
  {
    id: "demo-dashboard",
    title: "Sabiá Analytics",
    kind: "Demo · Dashboard SaaS",
    demo: true,
    summary: "Painel de vendas no estilo SaaS: KPIs com contagem animada e sparklines, gráficos Chart.js, mapa de calor, tabela com busca/filtros/ordenação, exportação CSV, paleta de comandos (Ctrl+K) e tema claro/escuro.",
    howToTest: "Troque o período (7d/30d/12m), aperte Ctrl+K, filtre a tabela e exporte o CSV.",
    details: [
      "Cerca de 21 mil pedidos gerados com um gerador pseudoaleatório com semente (sazonalidade, picos de almoço e fim de semana): os dados parecem reais e são sempre os mesmos. Todo número na tela é calculado a partir desses pedidos brutos, inclusive a comparação com o período anterior.",
      "Tabela com busca que ignora acentos e destaca o termo, filtros por status, cabeçalhos ordenáveis por teclado (<code>aria-sort</code>), paginação e exportação dos resultados filtrados em CSV (Blob). Paleta de comandos com <code>&lt;dialog&gt;</code>, skeleton ao trocar de período e números que fazem tween.",
      "Tema escuro e claro com contraste AA nos dois, gráficos que trocam de cor junto com o tema e tabela alternativa para leitores de tela."
    ],
    highlights: ["Agregações a partir de dados brutos", "Chart.js com comparação de período", "Ctrl+K command palette", "Exportação CSV com Blob", "Tema claro/escuro persistente"],
    tags: ["JavaScript", "Chart.js", "CSS", "Acessibilidade"],
    shots: [{ src: "assets/img/projetos/dashboard.webp", alt: "Sabiá Analytics em tema escuro: KPIs com sparklines, gráfico de receita e donut de vendas por categoria." }],
    links: { ...noLinks, demo: "demos/dashboard/index.html", github: "https://github.com/Romeu-q/romeu-q.github.io/tree/main/public/demos/dashboard" }
  },
  {
    id: "demo-pixel-shop",
    title: "Pixel Shop",
    kind: "Demo · E-commerce para devs indie",
    demo: true,
    summary: "Loja de packs de pixel art com cena animada no hero, sprites animados desenhados em canvas, filtros com animação de layout, cards com tilt 3D, modal com zoom e carrinho com cupom.",
    howToTest: "Abra um pack (teste o zoom), adicione ao carrinho e use o cupom PIXEL10.",
    details: [
      "Nenhuma imagem de produto é arquivo: cada sprite é desenhado em <code>&lt;canvas&gt;</code> a partir de grades de texto, com 2 a 4 quadros de animação, e só anima quando está visível na tela. O hero é uma cena com parallax em que o cavaleiro pula para pegar moedas.",
      "Filtro por categoria com animação de layout (FLIP), ordenação, busca, modal com zoom 1x/2x/4x e grade de pixels, carrinho com \"desfazer\", cupom e um checkout de demonstração com confete em pixel art.",
      "Modal e carrinho com <code>&lt;dialog&gt;</code> nativo, foco preso e retorno de foco; animações com a Web Animations API e uma mola calculada em código, tudo desligado com <code>prefers-reduced-motion</code>."
    ],
    highlights: ["Sprites animados em canvas a partir de dados", "FLIP layout animation", "Tilt 3D só em dispositivos com mouse", "Carrinho com desfazer e cupom", "Diálogos acessíveis"],
    tags: ["JavaScript", "Canvas", "Web Animations API", "localStorage"],
    shots: [{ src: "assets/img/projetos/pixel-shop.webp", alt: "Hero da Pixel Shop: cena noturna em pixel art com um cavaleiro, slime e moedas, ao lado do título 'Pixel art pronta para o seu próximo jogo'." }],
    links: { ...noLinks, demo: "demos/pixel-shop/index.html", github: "https://github.com/Romeu-q/romeu-q.github.io/tree/main/public/demos/pixel-shop" }
  }
];
