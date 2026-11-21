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
      label: 'Sortear frase +18',
      cards: [
        'Eu nunca tive um beijo que me fez esquecer onde eu estava.',
        'Eu nunca fiquei com alguém no mesmo dia em que conheci.',
        'Eu nunca mandei uma mensagem ousada e desliguei a tela de vergonha.',
        'Eu nunca beijei alguém em um lugar onde podia ser flagrado.',
        'Eu nunca tive uma amizade com benefícios.',
        'Eu nunca passei a noite na casa de alguém sem planejar.',
        'Eu nunca improvisei uma desculpa pra sair de uma festa acompanhado.',
        'Eu nunca flertei por mensagem com alguém que estava na mesma festa.',
        'Eu nunca marquei um encontro sem intenção nenhuma de ir embora cedo.',
        'Eu nunca deixei uma peça de roupa na casa de um contatinho de propósito.',
        'Eu nunca tive um encontro que só terminou no café da manhã.',
        'Eu nunca mandei uma foto provocante pra alguém de confiança.',
        'Eu nunca vivi um romance secreto que só meus amigos mais próximos sabiam.',
        'Eu nunca achei que era só um beijo e acabei querendo repetir a noite inteira.',
        'Eu nunca inventei uma playlist pra criar clima a dois.',
        'Eu nunca sussurrei algo no ouvido de alguém só pra provocar.',
        'Eu nunca tive vontade de beijar alguém desta roda.',
        'Eu nunca tive uma queda por alguém só pelo jeito de dançar.',
        'Eu nunca me arrumei achando que ia encontrar um contatinho e dei de cara com outro.',
        'Eu nunca tive um date tão bom que já marquei o próximo antes de ir embora.'
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
    ]}]
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

function showCards({title, description, rules, decks}) {
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
  for (const {label, cards} of decks) {
    let remaining = [];
    let previous;
    const button = document.createElement('button');
    button.className = actions.childElementCount ? 'secondary' : 'primary';
    button.textContent = label;
    button.onclick = () => {
      if (!remaining.length) {
        remaining = shuffle(cards);
        if (remaining.at(-1) === previous) {
          [remaining[0], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[0]];
        }
      }
      previous = remaining.pop();
      card.hidden = false;
      card.textContent = previous;
    };
    actions.append(button);
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
