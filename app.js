import { WORDS } from "./words.js?v=11";

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const turnEl = document.getElementById("turn-line");
const keyBtn = document.getElementById("key-btn");
const newBtn = document.getElementById("new-btn");
const restartBtn = document.getElementById("restart-btn");
const overlayEl = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const scoreRedEl = document.getElementById("score-red");
const scoreBlueEl = document.getElementById("score-blue");

const TEAM_LABEL = { red: "Red", blue: "Blue" };

const ART = {
  red: ["./images/red-agent-a.jpg", "./images/red-agent-b.jpg", "./images/red-agent-c.jpg"],
  blue: ["./images/blue-agent-a.jpg", "./images/blue-agent-b.jpg", "./images/blue-agent-c.jpg"],
  civilian: [
    "./images/civilian-a.jpg",
    "./images/civilian-b.jpg",
    "./images/civilian-c.jpg",
    "./images/civilian-d.jpg",
  ],
  assassin: ["./images/assassin.jpg"],
};

let game = createGame();
let keyAnimTimer = 0;
let overlayTimer = 0;

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function createGame() {
  const startingTeam = Math.random() < 0.5 ? "red" : "blue";
  const otherTeam = startingTeam === "red" ? "blue" : "red";
  const types = shuffle([
    ...Array(8).fill(startingTeam),
    ...Array(7).fill(otherTeam),
    "assassin",
    ...Array(9).fill("civilian"),
  ]);

  const artIndex = { red: 0, blue: 0, civilian: 0, assassin: 0 };

  return {
    startingTeam,
    otherTeam,
    spymasterView: false,
    winner: null,
    cards: shuffle(WORDS)
      .slice(0, 25)
      .map((word, index) => {
        const type = types[index];
        const variants = ART[type];
        const art = variants[artIndex[type] % variants.length];
        artIndex[type] += 1;
        return { word, type, art, revealed: false };
      }),
  };
}

function hideOverlay() {
  window.clearTimeout(overlayTimer);
  overlayEl.classList.remove("open", "win-red", "win-blue", "win-assassin");
  overlayEl.setAttribute("aria-hidden", "true");
}

function showOverlay() {
  const assassin = game.winner === "assassin";
  const winnerTeam = assassin ? game.otherTeam : game.winner;

  overlayKicker.textContent = assassin ? "Assassin" : "Game over";
  overlayTitle.textContent = `${TEAM_LABEL[winnerTeam]} wins`;
  overlayEl.classList.remove("win-red", "win-blue", "win-assassin");
  overlayEl.classList.add(assassin ? "win-assassin" : `win-${winnerTeam}`);

  window.clearTimeout(overlayTimer);
  overlayTimer = window.setTimeout(() => {
    overlayEl.classList.add("open");
    overlayEl.setAttribute("aria-hidden", "false");
    restartBtn.focus();
  }, 520);
}

function startNewGame() {
  hideOverlay();
  game = createGame();
  renderBoard();
}

function remaining(team) {
  return game.cards.filter((card) => card.type === team && !card.revealed).length;
}

function cardLabel(card) {
  return game.spymasterView || card.revealed
    ? `${card.word}, ${card.type}${card.revealed ? ", revealed" : ""}`
    : card.word;
}

function animateKeyFlip() {
  boardEl.classList.add("key-animating");
  window.clearTimeout(keyAnimTimer);
  keyAnimTimer = window.setTimeout(() => {
    boardEl.classList.remove("key-animating");
  }, 900);
}

function syncCard(button, card) {
  button.classList.toggle("flipped", card.revealed || game.spymasterView);
  button.classList.toggle("revealed", card.revealed);
  button.disabled = Boolean(game.winner) || card.revealed;
  button.setAttribute("aria-label", cardLabel(card));
}

function updateHud() {
  scoreRedEl.querySelector(".score-value").textContent = String(remaining("red"));
  scoreBlueEl.querySelector(".score-value").textContent = String(remaining("blue"));
  scoreRedEl.classList.toggle("lead", game.startingTeam === "red");
  scoreBlueEl.classList.toggle("lead", game.startingTeam === "blue");

  turnEl.textContent = game.winner
    ? "Game over"
    : `${TEAM_LABEL[game.startingTeam]} starts · 8 cards`;
  turnEl.className = `turn-line ${game.startingTeam}`;

  keyBtn.setAttribute("aria-pressed", String(game.spymasterView));
  keyBtn.textContent = game.spymasterView ? "Hide key" : "Show key";

  statusEl.className = "status";
  if (game.winner) {
    statusEl.textContent = "";
  } else {
    statusEl.textContent = game.spymasterView ? "Key visible to clue givers." : "";
  }
}

function renderBoard() {
  boardEl.replaceChildren(
    ...game.cards.map((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card";
      button.dataset.type = card.type;
      button.dataset.index = String(index);
      button.style.setProperty("--i", String(index));
      button.classList.toggle("long", card.word.length > 6);
      button.innerHTML = `
        <span class="card-inner">
          <span class="face front">
            <span class="punch"></span>
            <span class="word mirror">${card.word}</span>
            <span class="slot"></span>
            <span class="word-box"><span class="word">${card.word}</span></span>
          </span>
          <span class="face back">
            <img class="portrait" src="${card.art}" alt="" />
            <span class="word-box"><span class="word">${card.word}</span></span>
          </span>
        </span>
      `;
      syncCard(button, card);
      return button;
    })
  );
  updateHud();
}

function revealCard(index) {
  const card = game.cards[index];
  if (!card || card.revealed || game.winner || game.spymasterView) return;

  card.revealed = true;

  if (card.type === "assassin") {
    game.winner = "assassin";
  } else if (card.type === "red" || card.type === "blue") {
    if (remaining(card.type) === 0) game.winner = card.type;
  }

  const button = boardEl.querySelector(`[data-index="${index}"]`);
  if (button) syncCard(button, card);

  if (game.winner) {
    boardEl.querySelectorAll(".card").forEach((el, i) => {
      syncCard(el, game.cards[i]);
    });
    showOverlay();
  }

  updateHud();
}

boardEl.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (!card) return;
  revealCard(Number(card.dataset.index));
});

keyBtn.addEventListener("click", () => {
  game.spymasterView = !game.spymasterView;
  animateKeyFlip();
  boardEl.querySelectorAll(".card").forEach((button, index) => {
    syncCard(button, game.cards[index]);
  });
  updateHud();
});

newBtn.addEventListener("click", startNewGame);
restartBtn.addEventListener("click", startNewGame);

renderBoard();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
