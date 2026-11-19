const themes = [
  ['Comidas', 'Pão de queijo', 'Café da tarde'],
  ['Comidas', 'Pastel', 'Feira'],
  ['Comidas', 'Pipoca', 'Cinema'],
  ['Comidas', 'Brigadeiro', 'Festa'],
  ['Comidas', 'Açaí', 'Tigela'],
  ['Comidas', 'Tapioca', 'Frigideira'],
  ['Comidas', 'Feijoada', 'Almoço'],
  ['Lugares', 'Aeroporto', 'Embarque'],
  ['Lugares', 'Biblioteca', 'Silêncio'],
  ['Lugares', 'Praia', 'Verão'],
  ['Lugares', 'Estádio', 'Torcida'],
  ['Lugares', 'Aquário', 'Vidro'],
  ['Lugares', 'Rodoviária', 'Viagem'],
  ['Lugares', 'Parque de diversões', 'Fila'],
  ['Objetos', 'Guarda-chuva', 'Previsão'],
  ['Objetos', 'Binóculo', 'Distância'],
  ['Objetos', 'Controle remoto', 'Sofá'],
  ['Objetos', 'Chaveiro', 'Bolso'],
  ['Objetos', 'Lanterna', 'Escuro'],
  ['Objetos', 'Mochila', 'Costas'],
  ['Objetos', 'Espelho', 'Reflexo'],
  ['Animais', 'Capivara', 'Beira d’água'],
  ['Animais', 'Flamingo', 'Equilíbrio'],
  ['Animais', 'Camaleão', 'Disfarce'],
  ['Animais', 'Polvo', 'Braços'],
  ['Animais', 'Coruja', 'Madrugada'],
  ['Animais', 'Abelha', 'Colônia'],
  ['Animais', 'Pinguim', 'Frio'],
  ['Música', 'Microfone', 'Voz'],
  ['Música', 'Bateria', 'Ritmo'],
  ['Música', 'Vinil', 'Agulha'],
  ['Música', 'Karaokê', 'Letra'],
  ['Música', 'Sanfona', 'Fole'],
  ['Música', 'Fone de ouvido', 'Volume'],
  ['Atividades', 'Acampar', 'Barraca'],
  ['Atividades', 'Boliche', 'Pista'],
  ['Atividades', 'Surfar', 'Maré'],
  ['Atividades', 'Pescaria', 'Paciência'],
  ['Atividades', 'Andar de skate', 'Rampa'],
  ['Atividades', 'Fazer churrasco', 'Brasas']
];

const game = document.querySelector('#game');
const setup = document.querySelector('#setup');
let settings = {players: 5, intruders: 1};
let round;
let deck = [];
let previousTheme;

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function drawTheme() {
  if (!deck.length) {
    deck = shuffle(themes);
    if (deck.at(-1) === previousTheme) [deck[0], deck[deck.length - 1]] = [deck.at(-1), deck[0]];
  }
  previousTheme = deck.pop();
  return previousTheme;
}

function options(select, min, max, value) {
  select.replaceChildren(...Array.from({length: max - min + 1}, (_, index) => new Option(min + index)));
  select.value = Math.min(value, max);
}

function showSetup(focus = false) {
  round = undefined;
  game.replaceChildren(setup.content.cloneNode(true));
  const form = game.querySelector('form');
  const {players, intruders} = form.elements;
  options(players, 3, 24, settings.players);
  options(intruders, 1, settings.players - 1, settings.intruders);
  players.onchange = () => options(intruders, 1, Number(players.value) - 1, Number(intruders.value));
  form.onsubmit = event => {
    event.preventDefault();
    settings = {players: Number(players.value), intruders: Number(intruders.value)};
    startRound();
  };
  if (focus) form.querySelector('h2').focus();
}

function startRound() {
  const roles = Array.from({length: settings.players}, (_, index) => index < settings.intruders);
  round = {roles: shuffle(roles), theme: drawTheme(), player: 0};
  handoff();
}

function stage(content, actions) {
  game.innerHTML = `<section class="panel stage">${content}<div class="actions"></div></section>`;
  const controls = game.querySelector('.actions');
  for (const [label, run] of actions) {
    const button = document.createElement('button');
    button.className = controls.childElementCount ? 'secondary' : 'primary';
    button.textContent = label;
    button.onclick = run;
    controls.append(button);
  }
  game.querySelector('h1').focus();
}

function handoff() {
  stage(`
    <p class="count">Jogador ${round.player + 1} de ${settings.players}</p>
    <h1 tabindex="-1">Passe o celular</h1>
    <p>Quando for sua vez, olhe a tela sozinho e revele sua carta.</p>
  `, [['Revelar minha carta', reveal]]);
}

function reveal() {
  const [category, word, hint] = round.theme;
  const intruder = round.roles[round.player];
  stage(`
    <p class="count">Jogador ${round.player + 1} de ${settings.players}</p>
    <div class="role ${intruder ? 'intruder' : ''}">
      <small>${intruder ? 'Seu papel' : `Tema · ${category}`}</small>
      <h1 tabindex="-1">${intruder ? 'Intruso' : word}</h1>
      <p>${intruder ? `Dica · ${hint}` : 'Guarde esta palavra em segredo.'}</p>
    </div>
  `, [[round.player + 1 === settings.players ? 'Ocultar e começar a conversa' : 'Ocultar e passar', () => {
    round.player += 1;
    if (round.player < settings.players) handoff();
    else discuss();
  }]]);
}

function discuss() {
  stage(`
    <h1 tabindex="-1">Quem é o intruso?</h1>
    <p>Na ordem da roda, cada pessoa dá uma pista sem falar a palavra. Depois, conversem e votem em voz alta antes de conferir o resultado.</p>
  `, [['Revelar resultado', result]]);
}

function result() {
  const [category, word] = round.theme;
  const players = round.roles.flatMap((isIntruder, index) => isIntruder ? [index + 1] : []);
  const label = players.length === 1 ? 'Intruso' : 'Intrusos';
  stage(`
    <div class="role">
      <small>Tema · ${category}</small>
      <h1 tabindex="-1">${word}</h1>
      <p><strong>${label}</strong> · ${players.map(number => `Jogador ${number}`).join(', ')}</p>
    </div>
  `, [['Jogar outra rodada', startRound], ['Mudar jogadores', () => showSetup(true)]]);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && round && round.player < settings.players && game.querySelector('.role')) handoff();
});
showSetup();
