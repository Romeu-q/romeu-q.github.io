// data.js — cardápio fictício (mock).
// Fica separado do app.js para deixar claro que "dados" e "lógica" são coisas diferentes:
// num projeto real, este array viria de uma API ou banco de dados.
// Preço em número (reais), nunca em string: assim dá para somar e só formatar na hora de exibir.
// Ilustrações: emoji (sem imagens externas, sem direitos autorais, zero requisições extras).

const CATEGORIAS = [
  { id: 'todos', nome: 'Todos' },
  { id: 'cafes', nome: 'Cafés' },
  { id: 'gelados', nome: 'Gelados' },
  { id: 'doces', nome: 'Doces' },
  { id: 'salgados', nome: 'Salgados' },
];

const CARDAPIO = [
  { id: 'c1', cat: 'cafes', emoji: '☕', nome: 'Espresso do Sertão', desc: 'Grão torrado médio, corpo encorpado e final achocolatado.', preco: 6.0 },
  { id: 'c2', cat: 'cafes', emoji: '🥛', nome: 'Cappuccino Cremoso', desc: 'Espresso, leite vaporizado e canela em pó por cima.', preco: 11.5 },
  { id: 'c3', cat: 'cafes', emoji: '🍯', nome: 'Café com Rapadura', desc: 'Coado na hora e adoçado com rapadura raspada.', preco: 9.0 },
  { id: 'c4', cat: 'cafes', emoji: '🫖', nome: 'Café Coado na Prensa', desc: 'Método francês, notas de caramelo. Serve duas xícaras.', preco: 14.0 },
  { id: 'g1', cat: 'gelados', emoji: '🧊', nome: 'Cold Brew', desc: 'Extraído a frio por 14 horas. Suave e pouco ácido.', preco: 13.0 },
  { id: 'g2', cat: 'gelados', emoji: '🥤', nome: 'Frappé de Cacau', desc: 'Café batido com gelo, cacau e chantilly.', preco: 16.0 },
  { id: 'g3', cat: 'gelados', emoji: '🍋', nome: 'Limonada com Hortelã', desc: 'Limão siciliano, hortelã fresca e pouco açúcar.', preco: 10.0 },
  { id: 'd1', cat: 'doces', emoji: '🍰', nome: 'Bolo de Milho', desc: 'Receita da vovó: úmido, com queijo coalho derretido.', preco: 8.5 },
  { id: 'd2', cat: 'doces', emoji: '🍫', nome: 'Brownie de Cacau', desc: 'Casquinha crocante e centro molhadinho.', preco: 9.5 },
  { id: 'd3', cat: 'doces', emoji: '🍮', nome: 'Cartola Caramelizada', desc: 'Banana, queijo e canela com calda de açúcar mascavo.', preco: 12.0 },
  { id: 'd4', cat: 'doces', emoji: '🥐', nome: 'Croissant de Goiabada', desc: 'Massa folhada amanteigada recheada com goiabada cremosa.', preco: 10.5 },
  { id: 's1', cat: 'salgados', emoji: '🧀', nome: 'Pão de Queijo (4 un.)', desc: 'Quentinho, casquinha fina e miolo elástico.', preco: 9.0 },
  { id: 's2', cat: 'salgados', emoji: '🥪', nome: 'Sanduíche de Carne de Sol', desc: 'Pão de forma tostado, carne de sol desfiada e queijo.', preco: 19.0 },
  { id: 's3', cat: 'salgados', emoji: '🥟', nome: 'Pastel de Vento Assado', desc: 'Assado no forno, recheio de frango com catupiry.', preco: 8.0 },
];
