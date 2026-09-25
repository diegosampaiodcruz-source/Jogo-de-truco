const SUITS = [
  { name: 'Paus', symbol: '♣', color: '#1d2b36' },
  { name: 'Copas', symbol: '♥', color: '#d73939' },
  { name: 'Espadas', symbol: '♠', color: '#1d2b36' },
  { name: 'Ouros', symbol: '♦', color: '#d73939' }
];

const CARD_ORDER = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const SUIT_ORDER = ['Paus', 'Copas', 'Espadas', 'Ouros'];

const RANK_TO_VALUE = Object.fromEntries(CARD_ORDER.map((code, index) => [code, index + 1]));

const state = {
  players: [
    { id: 'you', label: 'Você', team: 0, hand: [], human: true },
    { id: 'partner', label: 'Parceiro', team: 0, hand: [], human: false },
    { id: 'opp1', label: 'Adversário 1', team: 1, hand: [], human: false },
    { id: 'opp2', label: 'Adversário 2', team: 1, hand: [], human: false }
  ],
  deck: [],
  vira: null,
  currentPlayer: 0,
  played: [],
  scores: { 0: 0, 1: 0 },
  currentBet: 1,
  pendingBet: null,
  gameOver: false,
  musicEnabled: true,
  chat: [],
  lastWinner: null,
  audioCtx: null,
  musicTimer: null
};

const elements = {
  scoreYou: document.getElementById('scoreYou'),
  scoreOpp: document.getElementById('scoreOpp'),
  betValue: document.getElementById('betValue'),
  turnBanner: document.getElementById('turnBanner'),
  viraCard: document.getElementById('viraCard'),
  playedArea: document.getElementById('playedArea'),
  handYou: document.getElementById('hand-you'),
  handPartner: document.getElementById('hand-partner'),
  handOpp1: document.getElementById('hand-opp1'),
  handOpp2: document.getElementById('hand-opp2'),
  chatLog: document.getElementById('chatLog'),
  signalPanel: document.getElementById('signalPanel'),
  toast: document.getElementById('toast'),
  musicBtn: document.getElementById('musicBtn'),
  trucoBtn: document.getElementById('trucoBtn'),
  newGameBtn: document.getElementById('newGameBtn')
};

function createDeck() {
  const deck = [];
  SUITS.forEach((suit) => {
    CARD_ORDER.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit.name}`,
        rank,
        suit: suit.name,
        symbol: suit.symbol,
        color: suit.color,
        value: RANK_TO_VALUE[rank],
        order: CARD_ORDER.indexOf(rank)
      });
    });
  });
  return deck;
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getNextRank(cardRank) {
  const index = CARD_ORDER.indexOf(cardRank);
  return CARD_ORDER[(index + 1) % CARD_ORDER.length];
}

function isManilha(card) {
  if (!state.vira) return false;
  return card.rank === getNextRank(state.vira.rank);
}

function getCardStrength(card) {
  const suitPower = SUIT_ORDER.indexOf(card.suit) + 1;

  if (isManilha(card)) {
    return 2000 + suitPower;
  }

  return 1000 + (RANK_TO_VALUE[card.rank] * 10);
}

function compareCards(a, b) {
  return getCardStrength(a) - getCardStrength(b);
}

function getPlayerByIndex(index) {
  return state.players[index];
}

function formatCardLabel(card) {
  return `${card.rank} de ${card.suit}`;
}

function renderCardSvg(card, isFace = true) {
  if (!card) {
    return '';
  }

  const isRed = card.color === '#d73939';
  const textColor = isRed ? '#d73939' : '#1d2b36';
  const accent = card.symbol;

  return `
    <svg viewBox="0 0 84 118" xmlns="http://www.w3.org/2000/svg" aria-label="${formatCardLabel(card)}">
      <rect x="2" y="2" width="80" height="114" rx="12" fill="#ffffff" stroke="#dfe7ef" stroke-width="2"/>
      <text x="16" y="20" font-size="16" font-weight="700" fill="${textColor}">${card.rank}</text>
      <text x="16" y="102" font-size="16" font-weight="700" transform="rotate(180 16 102)" fill="${textColor}">${card.rank}</text>
      <text x="42" y="64" font-size="28" text-anchor="middle" fill="${textColor}">${accent}</text>
      <text x="42" y="90" font-size="22" text-anchor="middle" fill="${textColor}">${accen t}</text>
      <text x="68" y="26" font-size="12" font-weight="700" fill="${textColor}">${card.symbol}</text>
      <text x="68" y="100" font-size="12" font-weight="700" transform="rotate(180 68 100)" fill="${textColor}">${card.symbol}</text>
    </svg>
  `;
}

function buildMatch() {
  state.players.forEach((player) => {
    player.hand = [];
  });

  state.deck = shuffle(createDeck());
  state.vira = state.deck.pop();
  state.currentPlayer = 0;
  state.played = [];
  state.pendingBet = null;
  state.currentBet = 1;
  state.gameOver = false;
  state.lastWinner = null;

  // deal 3 cards each (rotina simples de distribuição)
  for (let i = 0; i < 3; i += 1) {
    state.players.forEach((player) => {
      player.hand.push(state.deck.pop());
    });
  }

  state.chat = [
    { author: 'Sistema', text: 'Nova partida iniciada. Sua vez!' },
    { author: 'Sistema', text: `Vira: ${state.vira.rank} de ${state.vira.suit}` }
  ];

  render();
  showToast('Partida iniciada!');
  playTone(350, 0.08, 'triangle', 0.035);
}

function render() {
  elements.scoreYou.textContent = state.scores[0];
  elements.scoreOpp.textContent = state.scores[1];
  elements.betValue.textContent = state.currentBet;

  renderVira();
  renderPlayersHands();
  renderPlayedCards();
  renderTurnBadge();
  renderChat();
  updateButtons();
}

function renderVira() {
  elements.viraCard.innerHTML = renderCardSvg(state.vira, true);
}

function renderPlayersHands() {
  const handMap = {
    you: elements.handYou,
    partner: elements.handPartner,
    opp1: elements.handOpp1,
    opp2: elements.handOpp2
  };

  state.players.forEach((player) => {
    const container = handMap[player.id];
    container.innerHTML = '';

    if (player.id === 'you') {
      player.hand.forEach((card) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'card card-hand';
        button.setAttribute('aria-label', formatCardLabel(card));
        button.innerHTML = renderCardSvg(card, true);
        button.addEventListener('click', () => handleHumanPlay(card));
        container.appendChild(button);
      });
      return;
    }

    if (player.hand.length) {
      player.hand.forEach(() => {
        const cardNode = document.createElement('div');
        cardNode.className = 'card card-back';
        container.appendChild(cardNode);
      });
    }
  });
}

function renderPlayedCards() {
  elements.playedArea.innerHTML = '';

  const slots = Array(4).fill(null);
  state.played.forEach((entry) => {
    slots[entry.slot] = entry.card;
  });

  slots.forEach((card, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';

    if (card) {
      wrapper.innerHTML = renderCardSvg(card, true);
      wrapper.style.transform = `rotate(${(index - 1.5) * 5}deg)`;
    } else {
      wrapper.className = 'card card-back';
    }

    elements.playedArea.appendChild(wrapper);
  });
}

function renderTurnBadge() {
  const labels = {
    0: 'SUA VEZ',
    1: 'PARCEIRO JOGANDO',
    2: 'ADVERSÁRIO JOGANDO',
    3: 'ADVERSÁRIO JOGANDO'
  };
  elements.turnBanner.textContent = labels[state.currentPlayer] || 'VEZ';
}

function renderChat() {
  elements.chatLog.innerHTML = '';
  state.chat.slice(-8).forEach((entry) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${entry.author === 'Você' ? 'self' : ''}`.trim();
    bubble.textContent = `${entry.author}: ${entry.text}`;
    elements.chatLog.appendChild(bubble);
  });
}

function updateButtons() {
  elements.trucoBtn.disabled = state.gameOver || state.currentPlayer !== 0;
  elements.musicBtn.textContent = `🎵 MÚSICA: ${state.musicEnabled ? 'ON' : 'OFF'}`;
}

function handleHumanPlay(card) {
  if (state.gameOver || state.currentPlayer !== 0) return;
  playCard(0, card);
}

function playCard(playerIndex, card) {
  const player = getPlayerByIndex(playerIndex);
  const index = player.hand.findIndex((item) => item.id === card.id);
  if (index < 0) return;

  player.hand.splice(index, 1);
  state.played.push({ playerIndex, card, slot: state.played.length });
  state.currentPlayer = (playerIndex + 1) % 4;

  playTone(260 + playerIndex * 30, 0.08, 'sine', 0.025);

  if (state.played.length === 4) {
    setTimeout(resolveTrick, 700);
    render();
    return;
  }

  render();

  if (state.currentPlayer !== 0) {
    const wait = 1700 + Math.random() * 1300;
    setTimeout(() => {
      if (!state.gameOver) {
        aiPlay();
      }
    }, wait);
  }
}

function aiPlay() {
  if (state.gameOver || state.currentPlayer === 0) return;

  const player = getPlayerByIndex(state.currentPlayer);
  if (!player || !player.hand.length) return;

  const chosen = chooseAiCard(player);
  playCard(state.currentPlayer, chosen);
}

function chooseAiCard(player) {
  if (!player.hand.length) return null;

  if (state.played.length === 0) {
    return player.hand.reduce((best, current) => (
      getCardStrength(current) > getCardStrength(best) ? current : best
    ));
  }

  const lastCard = state.played[state.played.length - 1].card;
  const winningCards = player.hand.filter((card) => compareCards(card, lastCard) > 0);

  if (winningCards.length) {
    return winningCards.reduce((best, current) => (
      getCardStrength(current) > getCardStrength(best) ? current : best
    ));
  }

  return player.hand.reduce((best, current) => (
    getCardStrength(current) > getCardStrength(best) ? current : best
  ));
}

function resolveTrick() {
  const winnerEntry = state.played.reduce((best, current) => {
    if (!best) return current;
    return compareCards(current.card, best.card) > 0 ? current : best;
  }, null);

  const winnerIndex = winnerEntry.playerIndex;
  const team = getPlayerByIndex(winnerIndex).team;
  state.scores[team] += 1;
  state.lastWinner = winnerIndex;
  state.played = [];
  state.currentPlayer = winnerIndex;

  playTone(660, 0.09, 'square', 0.04);
  showToast(`${getPlayerByIndex(winnerIndex).label} venceu a vaza.`);

  const targetScore = 12;
  if (state.scores[0] >= targetScore || state.scores[1] >= targetScore) {
    state.gameOver = true;
    const winnerLabel = state.scores[0] >= targetScore ? '🏆 VITÓRIA!' : '😔 DERROTA';
    state.chat.push({ author: 'Sistema', text: `${winnerLabel} Placar final: ${state.scores[0]} x ${state.scores[1]}` });
    render();
    return;
  }

  state.chat.push({ author: 'Sistema', text: `${getPlayerByIndex(winnerIndex).label} ganhou a vaza.` });
  render();

  if (state.currentPlayer === 0) {
    showToast('Sua vez!');
  } else {
    const wait = 1200 + Math.random() * 900;
    setTimeout(() => {
      if (!state.gameOver) aiPlay();
    }, wait);
  }
}

function toggleSignals() {
  elements.signalPanel.classList.toggle('hidden');
}

function sendSignal(signalText) {
  state.chat.push({ author: 'Você', text: signalText });
  showToast('Seu parceiro recebeu o sinal.');
  render();

  const autoReply = {
    'Tenho jogo!': 'Entendi, vou seguir com confiança.',
    'Estou fraco': 'Sem problema, eu apoio.',
    'Confia em mim': 'Confio em você.',
    'Peça Truco': 'Truco aceito! Eu vou junto.',
    'Tenho manilha': 'Ótimo, vou tentar fechar.',
    'Não tenho nada': 'Tudo bem, seguimos firme.'
  }[signalText] || 'Entendi.';

  setTimeout(() => {
    state.chat.push({ author: 'Parceiro', text: autoReply });
    render();
  }, 800);
}

function bindSignals() {
  document.querySelectorAll('.signal-btn').forEach((button) => {
    button.addEventListener('click', () => {
      sendSignal(button.dataset.signal);
      elements.signalPanel.classList.add('hidden');
    });
  });
}

function handleTruco() {
  if (state.gameOver || state.currentPlayer !== 0) return;

  const nextBet = state.currentBet === 1 ? 3 : state.currentBet === 3 ? 6 : state.currentBet === 6 ? 9 : 12;
  if (nextBet > 12) return;

  state.currentBet = nextBet;
  state.pendingBet = { caller: 0, value: nextBet };
  state.chat.push({ author: 'Você', text: `TRUCO! ${nextBet} pontos` });
  render();
  showToast(`TRUCO! Mão agora em ${nextBet}.`);
  playTone(520, 0.12, 'sawtooth', 0.045);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    elements.toast.classList.remove('visible');
  }, 1200);
}

function playTone(frequency, duration, type = 'sine', volume = 0.02) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!state.audioCtx) {
    state.audioCtx = new AudioCtx();
  }

  const ctx = state.audioCtx;
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  updateButtons();

  if (!state.musicEnabled) {
    if (state.musicTimer) {
      clearInterval(state.musicTimer);
      state.musicTimer = null;
    }
    return;
  }

  if (state.musicTimer) {
    clearInterval(state.musicTimer);
  }

  state.musicTimer = setInterval(() => {
    playTone(196, 0.21, 'triangle', 0.018);
    setTimeout(() => playTone(261.63, 0.18, 'sine', 0.015), 210);
  }, 1100);
}

function bindEvents() {
  document.getElementById('signalBtn').addEventListener('click', toggleSignals);
  document.getElementById('newGameBtn').addEventListener('click', buildMatch);
  document.getElementById('trucoBtn').addEventListener('click', handleTruco);
  document.getElementById('musicBtn').addEventListener('click', toggleMusic);
  bindSignals();
}

function init() {
  bindEvents();
  buildMatch();
  toggleMusic();
}

init();
