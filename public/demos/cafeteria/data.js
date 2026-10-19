// data.js — dados fictícios do Café Sertão (cardápio, horários, origens).
// Fica separado do app.js de propósito: "dados" e "lógica" são coisas diferentes.
// Num projeto real, estes arrays viriam de uma API ou de um CMS; o app.js não precisaria mudar.
// Preço é número (em reais), nunca string: assim dá para somar e só formatar na hora de exibir.

const CATEGORIAS = [
  { id: 'todos', nome: 'Tudo' },
  { id: 'cafes', nome: 'Cafés' },
  { id: 'gelados', nome: 'Gelados' },
  { id: 'doces', nome: 'Doces' },
  { id: 'salgados', nome: 'Salgados' },
  { id: 'graos', nome: 'Grãos' },
];

// img: arquivo em ./img (720x900, webp). alt: descrição real da foto, em português,
// para quem usa leitor de tela (descreve a imagem, não repete o nome do produto à toa).
const CARDAPIO = [
  { id: 'espresso', cat: 'cafes', nome: 'Espresso do Sertão', desc: 'Blend da casa com grãos da Chapada. Corpo denso e final de rapadura.', notas: 'Chocolate · Rapadura', preco: 7, img: 'espresso', alt: 'Espresso sendo extraído direto num copinho de vidro' },
  { id: 'cappuccino', cat: 'cafes', nome: 'Cappuccino da Casa', desc: 'Espresso duplo, leite vaporizado e um toque de canela da terra.', notas: 'Cremoso · Canela', preco: 12.5, img: 'cappuccino', alt: 'Xícara preta com cappuccino e desenho de coração na espuma' },
  { id: 'latte-rapadura', cat: 'cafes', nome: 'Latte de Rapadura', desc: 'Nossa assinatura: latte adoçado com calda de rapadura feita aqui.', notas: 'Caramelo · Baunilha', preco: 13, img: 'latte-art', alt: 'Latte com arte em forma de folha numa xícara marrom sobre mesa de madeira', assinatura: true },
  { id: 'v60', cat: 'cafes', nome: 'Coado na V60', desc: 'Método filtrado, preparado na hora com o micro-lote da semana.', notas: 'Floral · Frutas amarelas', preco: 14, img: 'coado-v60', alt: 'Café sendo coado num filtro V60 sobre balança digital', assinatura: true },
  { id: 'cold-brew', cat: 'gelados', nome: 'Cold Brew 14 horas', desc: 'Extraído a frio por 14 horas. Suave, doce e com pouquíssima acidez.', notas: 'Cacau · Melaço', preco: 15, img: 'cold-brew', alt: 'Leite sendo despejado num copo de café gelado com cubos de gelo', assinatura: true },
  { id: 'latte-gelado', cat: 'gelados', nome: 'Latte Gelado de Cumaru', desc: 'Espresso, leite gelado e xarope de cumaru, a baunilha do sertão.', notas: 'Amêndoa · Baunilha', preco: 16, img: 'latte-gelado', alt: 'Mão segurando um copo de latte gelado com camadas de café e leite' },
  { id: 'bolo-milho', cat: 'doces', nome: 'Bolo de Milho com Coalho', desc: 'Receita de vó: úmido, com pedacinhos de queijo coalho derretido.', notas: 'Fatia generosa', preco: 9.5, img: 'bolo', alt: 'Fatia de bolo amarelo ao lado de uma xícara de café preto' },
  { id: 'croissant', cat: 'doces', nome: 'Croissant de Goiabada', desc: 'Massa folhada na manteiga, recheio de goiabada cascão cremosa.', notas: 'Folhado · Feito às 6h', preco: 11, img: 'croissant', alt: 'Croissants dourados sobre mesa clara, ao lado de um pote de mel' },
  { id: 'sonho', cat: 'doces', nome: 'Sonho de Creme', desc: 'Brioche macio, recheio de creme de baunilha e açúcar de confeiteiro.', notas: 'Do dia', preco: 10, img: 'doces', alt: 'Sonho recheado de creme e um doce folhado num prato branco' },
  { id: 'tostada', cat: 'salgados', nome: 'Tostada de Carne de Sol', desc: 'Pão de fermentação natural, carne de sol desfiada, coalho e cebola roxa.', notas: 'Para o almoço', preco: 24, img: 'sanduiche', alt: 'Tostada aberta com recheio de carne e folhas sobre tábua de madeira' },
  { id: 'cesta-paes', cat: 'salgados', nome: 'Cesta de Pães da Casa', desc: 'Pães de fermentação natural com manteiga de garrafa. Serve dois.', notas: 'Para dividir', preco: 18, img: 'paes', alt: 'Cesta de vime com pães rústicos de casca crocante' },
  { id: 'graos-chapada', cat: 'graos', nome: 'Grãos Chapada Diamantina', desc: 'Pacote de 250 g, torra média, moído na hora se você preferir.', notas: 'Catuaí amarelo · 1.100 m', preco: 48, img: 'graos-card', alt: 'Tigela de cerâmica cheia de grãos de café torrados sobre tecido de juta' },
];

// Horário de funcionamento. Índice = dia da semana do JavaScript (0 = domingo ... 6 = sábado).
// Horas em número decimal (7.5 = 7h30). null = fechado o dia inteiro.
const HORARIOS = [
  { dia: 'Domingo', abre: 8, fecha: 13 },
  { dia: 'Segunda', abre: 7, fecha: 19 },
  { dia: 'Terça', abre: 7, fecha: 19 },
  { dia: 'Quarta', abre: 7, fecha: 19 },
  { dia: 'Quinta', abre: 7, fecha: 19 },
  { dia: 'Sexta', abre: 7, fecha: 20 },
  { dia: 'Sábado', abre: 8, fecha: 20 },
];
