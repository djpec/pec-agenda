import {showSetup, shuffle} from './intruso.js?v=2';

const games = [
  {id: 'intruso', title: 'Intruso', mark: '?', description: 'Uma palavra secreta e alguém improvisando.'},
  {
    id: 'eu-nunca', title: 'Eu nunca', mark: '✦', description: 'Descubra as histórias que a roda nunca contou.',
    rules: [
      'Passem o celular e leiam uma carta em voz alta a cada vez.',
      'Quem já fez o que a carta diz pode contar a história ou só levantar a mão.',
      'Se a roda combinar, quem já fez pode escolher dar um gole da bebida que estiver tomando.'
    ],
    decks: [{
      key: 'classico',
      label: 'Sortear frase',
      cards: [
        'Eu nunca mandei áudio pra pessoa errada.',
        'Eu nunca ri antes de terminar de contar a piada.',
        'Eu nunca cantei a letra errada com toda a confiança.',
        'Eu nunca fui a uma festa sem conhecer quase ninguém.',
        'Eu nunca esqueci onde estacionei.',
        'Eu nunca fingi conhecer uma música só pelo refrão.',
        'Eu nunca inventei um apelido que pegou na roda inteira.',
        'Eu nunca perdi a saída porque estava conversando.',
        'Eu nunca troquei o dia de um compromisso.',
        'Eu nunca montei uma playlist secreta pra uma ocasião específica.',
        'Eu nunca pedi o mesmo prato três vezes seguidas.',
        'Eu nunca fiz amizade numa fila.'
      ]
    }, {
      key: '18',
      label: 'Sortear frase +18',
      cards: [
        'Eu nunca fiz sexo oral no primeiro encontro.',
        'Eu nunca transei com duas pessoas ao mesmo tempo.',
        'Eu nunca usei um vibrador durante a transa.',
        'Eu nunca transei de frente pra um espelho.',
        'Eu nunca me masturbei durante uma chamada de vídeo.',
        'Eu nunca transei num carro estacionado.',
        'Eu nunca acordei alguém pra perguntar se topava transar de novo.',
        'Eu nunca gravei um vídeo de sexo com o consentimento de todo mundo.',
        'Eu nunca fiz sexo anal.',
        'Eu nunca pedi pra alguém me dar tapas na bunda durante a transa.',
        'Eu nunca usei venda ou algemas durante o sexo.',
        'Eu nunca transei na cozinha.',
        'Eu nunca falei sacanagem durante o sexo e comecei a rir.',
        'Eu nunca contei uma fantasia sexual e acabei realizando no mesmo dia.',
        'Eu nunca tive um orgasmo usando um brinquedo junto com outra pessoa.',
        'Eu nunca fingi um orgasmo só pra acabar logo.',
        'Eu nunca combinei uma palavra de segurança antes de transar.',
        'Eu nunca transei mais de três vezes na mesma noite.',
        'Eu nunca assisti pornô com alguém pra escolher o que queríamos experimentar.',
        'Eu nunca fiz uma encenação erótica com alguém.'
      ]
    }]
  },
  {
    id: 'verdade-ou-desafio', title: 'Verdade ou desafio', mark: '↯', description: 'Escolha entre soltar a verdade ou encarar uma missão.',
    rules: [
      'Na sua vez, escolha Verdade para responder a uma pergunta ou Desafio para cumprir uma missão.',
      'Leia a carta em voz alta e passe o celular ao terminar.',
      'Qualquer pessoa pode pular uma carta. Se a roda quiser uma alternativa, vale escolher um gole da própria bebida.'
    ],
    decks: [
      {label: 'Verdade', cards: [
        'Qual foi a sua desculpa mais criativa para chegar atrasado?',
        'Que música você sabe de cor e ninguém imaginaria?',
        'Qual mania sua seus amigos imitam?',
        'Qual foi o melhor conselho que você ignorou?',
        'Se você pudesse reviver uma noite com a galera, qual escolheria?',
        'Qual comida você defenderia mesmo se ninguém aqui gostasse?',
        'Qual foi sua ideia mais aleatória que deu certo?',
        'O que sempre te faz rir no pior momento possível?'
      ]},
      {label: 'Desafio', cards: [
        'Narre os próximos dez segundos da roda como se fosse final de campeonato.',
        'Venda um objeto que estiver por perto como se fosse uma invenção revolucionária.',
        'Faça a abertura de um telejornal sobre o que acabou de acontecer na roda.',
        'Imite um som de animal até alguém acertar qual é.',
        'Crie um passo de dança sentado e ensine para a pessoa à sua esquerda.',
        'Invente o refrão de uma música sobre o lugar onde vocês estão.',
        'Faça uma propaganda de quinze segundos para um sabor impossível de sorvete.',
        'Escolha um objeto e descreva sem dizer o nome até alguém acertar.'
      ]}
    ]
  },
  {
    id: 'mais-provavel', title: 'Quem é mais provável?', mark: '◎', description: 'Leiam a pergunta e apontem juntos na contagem de três.',
    rules: [
      'Sorteiem uma pergunta e leiam em voz alta.',
      'Contem até três. Cada pessoa aponta para quem mais combina com a pergunta.',
      'Quem receber mais votos pode contar uma história, escolher dar um gole ou só passar a vez. Em caso de empate, vale jogar outra carta.'
    ],
    decks: [{label: 'Sortear pergunta', cards: [
      'Quem é mais provável de virar DJ no meio da festa?',
      'Quem é mais provável de planejar uma viagem no grupo e esquecer de reservar o próprio quarto?',
      'Quem é mais provável de transformar uma ida à padaria em uma aventura?',
      'Quem é mais provável de fazer amizade com a mesa ao lado?',
      'Quem é mais provável de saber todas as coreografias?',
      'Quem é mais provável de criar um grupo só pra mandar figurinhas?',
      'Quem é mais provável de cantar no karaokê sem olhar a letra?',
      'Quem é mais provável de encontrar o caminho sem abrir o mapa?',
      'Quem é mais provável de chegar com comida suficiente pra dobrar a roda?',
      'Quem é mais provável de marcar uma festa para comemorar que marcou outra festa?'
    ]}, {
      key: '18', label: 'Sortear pergunta +18', cards: [
        'Quem é mais provável de fazer sexo oral no primeiro encontro?',
        'Quem é mais provável de propor um ménage e ainda organizar o encontro?',
        'Quem é mais provável de levar um vibrador na mala de viagem?',
        'Quem é mais provável de mandar um áudio gemendo de propósito?',
        'Quem é mais provável de passar a madrugada inteira transando?',
        'Quem é mais provável de topar sexo anal e falar abertamente do que gosta?',
        'Quem é mais provável de fazer um striptease sem perder a pose?',
        'Quem é mais provável de se masturbar numa chamada de vídeo com alguém?',
        'Quem é mais provável de sugerir uma transa de frente pro espelho?',
        'Quem é mais provável de pedir pra ser algemado na cama?',
        'Quem é mais provável de levar uma lista de posições pra testar?',
        'Quem é mais provável de sugerir uma gravação caseira se todo mundo topar?',
        'Quem é mais provável de soltar um palavrão no orgasmo?',
        'Quem é mais provável de propor uma encenação na hora do sexo?',
        'Quem é mais provável de comprar um brinquedo sexual no impulso e usar no mesmo dia?',
        'Quem é mais provável de pedir tapas na bunda durante a transa?',
        'Quem é mais provável de pagar um motel só pra realizar uma fantasia?',
        'Quem é mais provável de pedir pra apagar a luz e depois querer transar com ela acesa?',
        'Quem é mais provável de assistir pornô a dois pra pegar ideias?',
        'Quem é mais provável de pedir outra rodada antes de sair da cama?'
      ]
    }]
  }
];

const game = document.querySelector('#game');
const back = document.querySelector('.back');

function showMenu() {
  game.innerHTML = `
    <section class="intro menu-intro">
      <div><h1>Jogos de roda<span>.</span></h1><p>Escolha o jogo e passe o celular.</p></div>
    </section>
    <nav class="game-list" aria-label="Escolher jogo">
      ${games.map(({id, mark, title, description}) => `
        <a class="panel game-link" href="#${id}">
          <span class="game-mark" aria-hidden="true">${mark}</span>
          <span><strong>${title}</strong><small>${description}</small></span>
          <span aria-hidden="true">→</span>
        </a>
      `).join('')}
    </nav>`;
}

const seenByDeck = new Map();

function persistentDeck(gameId, {key, cards, label}, button, showCard) {
  const storageKey = `pec-jogos:${gameId}:${key}`;
  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) return saved.filter(card => cards.includes(card));
    } catch {}
    return seenByDeck.get(storageKey) ?? [];
  };
  const resetLabel = key === '18' ? 'Reembaralhar +18' : 'Reembaralhar clássico';
  const refresh = seen => {
    button.textContent = seen.size === cards.length ? resetLabel : label;
  };
  refresh(new Set(read()));
  button.onclick = () => {
    let seen = read();
    const drawn = new Set(seen);
    let available = cards.filter(card => !drawn.has(card));
    if (available.length === 0) {
      if (button.textContent !== resetLabel) {
        refresh(drawn);
        return;
      }
      available = cards.filter(card => card !== seen.at(-1));
      seen = [];
      drawn.clear();
    }
    const next = available[Math.floor(Math.random() * available.length)];
    seen.push(next);
    drawn.add(next);
    seenByDeck.set(storageKey, seen);
    try { localStorage.setItem(storageKey, JSON.stringify(seen)); } catch {}
    showCard(next);
    refresh(drawn);
  };
}

function showCards({id, title, description, rules, decks}) {
  game.innerHTML = `
    <section class="intro menu-intro"><div><h1>${title.replace(/\?$/, '')}<span>${title.endsWith('?') ? '?' : '.'}</span></h1><p>${description}</p></div></section>
    <details class="rules" open>
      <summary>Como jogar</summary><ol>${rules.map(rule => `<li>${rule}</li>`).join('')}</ol>
      <p>Funciona com qualquer bebida. Participar e beber são escolhas de cada pessoa.</p>
    </details>
    <section class="panel stage card-stage" aria-label="Cartas">
      <p class="role party-card" aria-live="polite" hidden></p>
      <div class="actions"></div>
    </section>`;
  const card = game.querySelector('.party-card');
  const actions = game.querySelector('.actions');
  const showCard = text => {
    card.hidden = false;
    card.textContent = text;
  };
  for (const deck of decks) {
    const {key, label, cards} = deck;
    let remaining = [];
    let previous;
    const button = document.createElement('button');
    button.className = actions.childElementCount ? 'secondary' : 'primary';
    actions.append(button);
    if (key) {
      persistentDeck(id, deck, button, showCard);
      continue;
    }
    button.textContent = label;
    button.onclick = () => {
      if (!remaining.length) {
        remaining = shuffle(cards);
        if (remaining.at(-1) === previous) {
          [remaining[0], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[0]];
        }
      }
      previous = remaining.pop();
      showCard(previous);
    };
  }
}

function navigate(focus = false) {
  const selected = games.find(({id}) => location.hash === '#' + id);
  back.hidden = !selected;
  document.title = selected ? selected.title + ' · pec jogos' : 'pec jogos · Jogos de roda';
  if (!selected) showMenu();
  else if (selected.id === 'intruso') showSetup();
  else showCards(selected);
  if (focus) {
    const heading = game.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus();
  }
}

addEventListener('hashchange', () => navigate(true));
navigate();
