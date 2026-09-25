const SUITS = [
  {name:"Paus", symbol:"♣", power:1},
  {name:"Copas", symbol:"♥", power:2},
  {name:"Espadas", symbol:"♠", power:3},
  {name:"Ouros", symbol:"♦", power:4}
];
const RANKS = [
  {name:"4", value:4}, {name:"5", value:5}, {name:"6", value:6},
  {name:"7", value:7}, {name:"Q", value:10}, {name:"J", value:11},
  {name:"K", value:12}, {name:"A", value:13}, {name:"2", value:14},
  {name:"3", value:15}
];

let state = null;
const $ = id => document.getElementById(id);

function makeDeck() {
  return SUITS.flatMap(s => RANKS.map(r => ({...r, suit:s.name, symbol:s.symbol, suitPower:s.power})));
}
function shuffle(a) {
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function cardPower(card) {
  if (card.name === state.manilhaRank) return 100 + card.suitPower;
  return card.value;
}
function sortHand(hand) { hand.sort((a,b)=>cardPower(a)-cardPower(b)); }

function newGame() {
  state = {
    scores:[0,0], handValue:1, acceptedValue:1, pendingRaise:false,
    players:[{name:"Você",team:0,hand:[]},{name:"Rival 1",team:1,hand:[]},{name:"Parceiro",team:0,hand:[]},{name:"Rival 3",team:1,hand:[]}],
    turn:0, trick:1, played:[], trickWins:[0,0], roundActive:true, waitingRaise:false
  };
  dealRound();
  $("status").textContent = "Sua vez! Escolha uma carta.";
  render();
}
function dealRound() {
  const deck = shuffle(makeDeck());
  state.vira = deck.pop();
  state.manilhaRank = nextRank(state.vira.name);
  state.players.forEach(p => p.hand = [deck.pop(),deck.pop(),deck.pop()]);
  state.players.forEach(p=>sortHand(p.hand));
  state.turn = 0;
  state.trick = 1;
  state.played = [];
  state.trickWins = [0,0];
  state.handValue = 1;
  state.acceptedValue = 1;
  state.waitingRaise = false;
}
function nextRank(rank) {
  const i = RANKS.findIndex(r=>r.name===rank);
  return RANKS[(i+1)%RANKS.length].name;
}
function render() {
  $("scoreUs").textContent=state.scores[0]; $("scoreThem").textContent=state.scores[1];
  $("trickNumber").textContent=state.trick; $("handValue").textContent=state.handValue;
  renderHand(0,"hand1",true); renderHand(1,"hand2",false); renderHand(2,"hand3",false); renderHand(3,"hand4",false);
  const played=$("played"); played.innerHTML="";
  state.played.forEach((x,i)=>played.appendChild(cardElement(x.card,false,true,i)));
  $("trucoBtn").disabled = !state.roundActive || state.waitingRaise || state.handValue>=12;
  $("acceptBtn").disabled = !state.waitingRaise;
  $("runBtn").disabled = !state.waitingRaise;
}
function renderHand(pi,id,clickable) {
  const el=$(id); el.innerHTML="";
  state.players[pi].hand.forEach((c,i)=>el.appendChild(cardElement(c,clickable,false,i)));
}
function cardElement(c,clickable,played,index) {
  const d=document.createElement("div");
  d.className="card"+(c.suit==="Copas"||c.suit==="Ouros"?" red ":" ")+(clickable?"hand-card":"")+(played?" played-card":"");
  if (!clickable && !played) { d.className="card back"; return d; }
  d.innerHTML=`<strong>${c.name}</strong><small>${c.symbol}</small>`;
  if (played) d.style.setProperty("--rot", `${(index%2?1:-1)*index*3}deg`);
  if (clickable) d.onclick=()=>playHumanCard(c);
  return d;
}
function playHumanCard(card) {
  if (!state.roundActive || state.waitingRaise || state.turn!==0) return;
  playCard(0,card);
}
function playCard(pi,card) {
  const p=state.players[pi];
  const idx=p.hand.indexOf(card); if(idx<0)return;
  p.hand.splice(idx,1);
  state.played.push({player:pi,card});
  state.turn=(pi+1)%4;
  render();
  if(state.played.length===4) setTimeout(resolveTrick,800);
  else if(state.turn!==0) setTimeout(aiTurn,550);
  else $("status").textContent="Sua vez! Escolha uma carta.";
}
function aiTurn() {
  if(!state.roundActive || state.waitingRaise || state.turn===0)return;
  const pi=state.turn, p=state.players[pi];
  if (maybeAiTruco(pi)) return;
  const card=chooseAiCard(pi);
  playCard(pi,card);
}
function chooseAiCard(pi) {
  const hand=state.players[pi].hand;
  if(state.played.length===0) return hand[Math.floor(Math.random()*hand.length)];
  const strongest=hand.reduce((a,b)=>cardPower(a)>cardPower(b)?a:b);
  const weakest=hand.reduce((a,b)=>cardPower(a)<cardPower(b)?a:b);
  const current=state.played[state.played.length-1];
  return cardPower(current.card)>cardPower(strongest) ? weakest : strongest;
}
function maybeAiTruco(pi) {
  if(state.handValue>=12 || state.waitingRaise || state.played.length===4) return false;
  const p=state.players[pi];
  const strong=p.hand.filter(c=>cardPower(c)>=13).length;
  if(strong>=2 && Math.random()<0.18) {
    requestRaise(pi);
    return true;
  }
  return false;
}
function requestRaise(pi) {
  const next = state.handValue===1?3:state.handValue===3?6:state.handValue===6?9:12;
  state.handValue=next; state.waitingRaise=true; state.pendingRaise=pi;
  $("status").textContent = `${state.players[pi].name} pediu ${next === 3 ? "TRUCO" : next}!`;
  render();
  if(pi!==0) {
    setTimeout(()=>aiRespondToRaise(),700);
  }
}
function aiRespondToRaise() {
  const required=state.handValue;
  const humanTeam=0;
  const adversaryAsked=state.players[state.pendingRaise].team!==humanTeam;
  const asker=state.pendingRaise;
  const responders=[0,1,2,3].filter(i=>i!==asker && state.players[i].team!==state.players[asker].team);
  const best=responders.reduce((m,i)=>Math.max(m,...state.players[i].hand.map(cardPower)),0);
  if(best>=13 || Math.random()<0.38) {
    state.waitingRaise=false; state.acceptedValue=required;
    $("status").textContent=`${state.players[asker].name} pediu ${labelValue(required)}. Aceito!`;
    render();
    if(state.turn!==0) setTimeout(aiTurn,500);
  } else {
    const pts=state.acceptedValue;
    state.scores[state.players[asker].team]+=pts;
    endRound(`${state.players[asker].name} fez a outra dupla correr.`);
  }
}
function labelValue(v){ return v===3?"TRUCO":String(v); }
function resolveTrick() {
  const max=Math.max(...state.played.map(x=>cardPower(x.card)));
  const winners=state.played.filter(x=>cardPower(x.card)===max);
  const winner=winners[0].player;
  state.trickWins[state.players[winner].team]++;
  $("status").textContent=`${state.players[winner].name} venceu a vaza!`;
  if(state.trickWins[state.players[winner].team]>=2 || state.trick>=3) {
    const team=state.trickWins[0]>state.trickWins[1]?0:1;
    state.scores[team]+=state.handValue;
    setTimeout(()=>endRound(team===0?"Sua dupla ganhou a rodada!":"A dupla adversária ganhou a rodada!"),700);
    return;
  }
  state.trick++; state.played=[]; state.turn=winner; render();
  setTimeout(()=>state.turn===0?$("status").textContent="Sua vez!":aiTurn(),600);
}
function endRound(msg) {
  state.roundActive=false; state.waitingRaise=false; $("status").textContent=msg;
  render();
  if(state.scores[0]>=12 || state.scores[1]>=12) {
    $("status").textContent += ` Partida encerrada: ${state.scores[0]>=12?"sua dupla":"a dupla adversária"} chegou a 12.`;
  } else {
    setTimeout(()=>{ dealRound(); state.roundActive=true; $("status").textContent="Nova rodada! Sua vez."; render(); },1300);
  }
}
$("newGame").onclick=newGame;
$("trucoBtn").onclick=()=>{ if(state.roundActive && !state.waitingRaise) requestRaise(0); };
$("acceptBtn").onclick=()=>{ state.waitingRaise=false; state.acceptedValue=state.handValue; $("status").textContent="Você aceitou!"; render(); if(state.turn!==0)setTimeout(aiTurn,500); };
$("runBtn").onclick=()=>{
  if(!state.waitingRaise)return;
  const team=state.players[state.pendingRaise].team;
  state.scores[team]+=state.acceptedValue;
  endRound("Você correu. A outra dupla marcou os pontos.");
};
$("helpBtn").onclick=()=> $("help").showModal();
$("closeHelp").onclick=()=> $("help").close();
newGame();
