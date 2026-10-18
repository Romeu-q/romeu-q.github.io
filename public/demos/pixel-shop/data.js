/* ==========================================================================
   data.js — catálogo da loja (tudo fictício).

   Por que separar os dados da interface?
   Assim a UI (app.js) só "lê" o catálogo e desenha. Para adicionar um pack
   novo basta incluir um objeto aqui; não precisa mexer em mais nada.

   - preco: em CENTAVOS (inteiro). Evita erros de ponto flutuante
     (0.1 + 0.2 !== 0.3) na hora de somar o carrinho e aplicar cupom.
   - sprite: nome da chave em SPRITES (sprites.js).
   - paleta: cores que os dígitos '0'..'5' do sprite representam.
   ========================================================================== */

const CATEGORIAS = {
  tilesets: 'Tilesets',
  personagens: 'Personagens',
  interface: 'Interface',
  efeitos: 'Efeitos',
  fontes: 'Fontes',
  itens: 'Itens',
};

const PRODUTOS = [
  {
    id: 'floresta-encantada',
    nome: 'Floresta Encantada',
    categoria: 'tilesets',
    preco: 2990,
    data: '2026-08-02',
    sprite: 'arvore',
    paleta: ['#0b3d20', '#2e8b3d', '#7bd04a', '#7a4a21', '#3a2a1a'],
    descricao: 'Tileset top-down de floresta com árvores, arbustos, trilhas e rios, pronto para mapas no Tiled.',
    inclui: ['Tileset 16x16 (256 tiles)', 'Árvores em 3 estações', 'Mapa de exemplo (.tmx)', 'Arquivo .aseprite editável'],
    licenca: 'Uso comercial liberado em projetos próprios. Proibido revender o pack.',
  },
  {
    id: 'masmorra-profunda',
    nome: 'Masmorra Profunda',
    categoria: 'tilesets',
    preco: 3490,
    data: '2026-05-14',
    sprite: 'tijolo',
    paleta: ['#1b1030', '#5a4a8a', '#8a7ac0'],
    descricao: 'Paredes, chãos, portas e armadilhas para dungeon crawlers. Paleta fria e sombria.',
    inclui: ['Tileset 16x16 (320 tiles)', 'Portas e alavancas animadas', 'Autotile de paredes', 'Paleta em .gpl'],
    licenca: 'Uso comercial liberado em projetos próprios. Proibido revender o pack.',
  },
  {
    id: 'cavaleiro-pixel',
    nome: 'Cavaleiro Pixel',
    categoria: 'personagens',
    preco: 2490,
    data: '2026-09-10',
    sprite: 'cavaleiro',
    paleta: ['#1a1a2e', '#b8c4d8', '#ffffff', '#f2b38a', '#3a5fcd', '#6b3f1d'],
    descricao: 'Herói de armadura com ciclos de andar, correr, atacar e levar dano em 4 direções.',
    inclui: ['Spritesheet 32x32', '6 animações', '3 paletas de cor', 'Arquivo .aseprite com tags'],
    licenca: 'Uso comercial liberado. Créditos opcionais, mas apreciados.',
  },
  {
    id: 'bestiario-slimes',
    nome: 'Bestiário de Slimes',
    categoria: 'personagens',
    preco: 1990,
    data: '2026-06-21',
    sprite: 'slime',
    paleta: ['#1a0f33', '#3ec46d', '#a6f5b8', '#ffffff', '#1a0f33'],
    descricao: 'Doze slimes inimigos com variações de cor, tamanho e ataques simples. Ótimo para protótipos.',
    inclui: ['12 slimes 16x16', 'Animação idle, pulo e morte', 'Troca de paleta por elemento', 'PNG + JSON de atlas'],
    licenca: 'Uso comercial liberado em projetos próprios.',
  },
  {
    id: 'ui-kit-arcade',
    nome: 'UI Kit Arcade',
    categoria: 'interface',
    preco: 3290,
    data: '2026-07-05',
    sprite: 'painel',
    paleta: ['#0d0a1f', '#8f7bff', '#3b2f7a', '#231a4d', '#ff4d6d', '#120d2e'],
    descricao: 'Painéis, botões, barras de vida e caixas de diálogo no estilo arcade. Nine-slice pronto.',
    inclui: ['40 elementos de interface', 'Painéis nine-slice', 'Cursores e ícones de menu', 'Guia de uso em PDF'],
    licenca: 'Uso comercial liberado em projetos próprios. Proibido revender o pack.',
  },
  {
    id: 'explosoes-8bit',
    nome: 'Explosões 8-bit',
    categoria: 'efeitos',
    preco: 1790,
    data: '2026-09-28',
    sprite: 'explosao',
    paleta: ['#d9480f', '#ff9f1c', '#ffe066', '#ffffff'],
    descricao: 'Explosões, faíscas e fumaça em quadros curtos, pensados para dar impacto a cada golpe.',
    inclui: ['15 efeitos animados', 'Quadros de 8 a 12 frames', 'Versão em tons de cinza', 'Spritesheets em PNG'],
    licenca: 'Uso comercial liberado. Proibido revender o pack.',
  },
  {
    id: 'fonte-bitquest',
    nome: 'Fonte Bitquest',
    categoria: 'fontes',
    preco: 990,
    data: '2026-04-18',
    sprite: 'letra',
    paleta: ['#000000', '#ffd23f', '#b8860b'],
    descricao: 'Fonte bitmap com acentos do português, símbolos de jogo e versões em 8px e 16px.',
    inclui: ['Fonte .ttf e .fnt (BMFont)', 'Suporte a acentos PT-BR', 'Setas e ícones de botão', 'Folha de caracteres em PNG'],
    licenca: 'Uso comercial liberado, inclusive em logotipos de jogos.',
  },
  {
    id: 'pocoes-frascos',
    nome: 'Poções & Frascos',
    categoria: 'itens',
    preco: 1490,
    data: '2026-03-30',
    sprite: 'pocao',
    paleta: ['#1a0f33', '#bfe9ff', '#ff4d9d', '#ffd1e8', '#000000', '#8a5a2b'],
    descricao: 'Quarenta poções, frascos e elixires em 16x16 para inventários de RPG.',
    inclui: ['40 ícones 16x16', 'Versões 32x32 ampliadas', 'Variações de cor por efeito', 'Arquivo .aseprite'],
    licenca: 'Uso comercial liberado em projetos próprios.',
  },
  {
    id: 'gemas-moedas',
    nome: 'Gemas e Moedas',
    categoria: 'itens',
    preco: 1290,
    data: '2026-08-19',
    sprite: 'gema',
    paleta: ['#0d2a4a', '#2fa4ff', '#7fd8ff', '#ffffff'],
    descricao: 'Moedas giratórias, gemas brilhantes e baús de tesouro para colecionáveis de plataforma.',
    inclui: ['24 colecionáveis', 'Moeda com giro de 8 frames', 'Brilho (sparkle) animado', 'Lista de sons sugeridos'],
    licenca: 'Uso comercial liberado em projetos próprios.',
  },
  {
    id: 'vila-medieval',
    nome: 'Vila Medieval',
    categoria: 'tilesets',
    preco: 3990,
    data: '2026-10-05',
    sprite: 'casa',
    paleta: ['#1a0f33', '#d1495b', '#f2d8a7', '#4cc9f0', '#6b3f1d'],
    descricao: 'Casas, mercados, poços e muralhas para montar cidades e vilarejos em perspectiva 3/4.',
    inclui: ['Tileset 16x16 (400 tiles)', '12 prédios modulares', 'Decorações e NPCs estáticos', 'Mapa de exemplo (.tmx)'],
    licenca: 'Uso comercial liberado em projetos próprios. Proibido revender o pack.',
  },
];

/* Busca um produto pelo id. Usada pelo carrinho (que guarda só ids). */
function buscarProduto(id) {
  return PRODUTOS.find((p) => p.id === id) || null;
}
