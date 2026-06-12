const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;
const TICK_RATE = 30;
const WORLD = { w: 4200, h: 3000 };
const FOOD_COUNT = 135;
const HAZARD_COUNT = 22;
const PRACTICE_BOT_COUNT = 4;
const INITIAL_LENGTH = 42;
const BOT_INITIAL_LENGTH = 38;
const MAX_NAME_LENGTH = 20;
const MIN_LENGTH = 34;
const BOOST_MULTIPLIER = 1.75;
const BOOST_LENGTH_COST = 10;

const allowedColors = [
  "#22c55e", "#38bdf8", "#f97316", "#a855f7", "#ef4444", "#facc15",
  "#14b8a6", "#ec4899", "#84cc16", "#64748b"
];

const botNames = ["Apple Ace", "Book Bot", "Mango Max", "Pencil Pro", "Kiwi Kid", "Berry Bee"];

const modes = {
  practice: { label: "Practice", baseSpeed: 112, maxSpeed: 196, turnRate: 0.18, growth: 5, penalty: 6, collision: false },
  battle: { label: "Battle", baseSpeed: 136, maxSpeed: 245, turnRate: 0.2, growth: 7, penalty: 14, collision: true },
  teams: { label: "Teams", baseSpeed: 125, maxSpeed: 224, turnRate: 0.19, growth: 6, penalty: 10, collision: true }
};

const vocabulary = [
  { emoji: "🍎", en: "Apple", es: "Manzana", category: "Fruits", color: "#ef4444", article: "an" },
  { emoji: "🍌", en: "Banana", es: "Banano", category: "Fruits", color: "#facc15", article: "a" },
  { emoji: "🍊", en: "Orange", es: "Naranja", category: "Fruits", color: "#fb923c", article: "an" },
  { emoji: "🍓", en: "Strawberry", es: "Fresa", category: "Fruits", color: "#e11d48", article: "a" },
  { emoji: "🍇", en: "Grapes", es: "Uvas", category: "Fruits", color: "#8b5cf6", article: "some" },
  { emoji: "🍉", en: "Watermelon", es: "Sandia", category: "Fruits", color: "#22c55e", article: "a" },
  { emoji: "🍍", en: "Pineapple", es: "Pina", category: "Fruits", color: "#eab308", article: "a" },
  { emoji: "🥭", en: "Mango", es: "Mango", category: "Fruits", color: "#f97316", article: "a" },
  { emoji: "🍐", en: "Pear", es: "Pera", category: "Fruits", color: "#84cc16", article: "a" },
  { emoji: "🍑", en: "Peach", es: "Durazno", category: "Fruits", color: "#fb7185", article: "a" },
  { emoji: "🥝", en: "Kiwi", es: "Kiwi", category: "Fruits", color: "#65a30d", article: "a" },
  { emoji: "🍒", en: "Cherries", es: "Cerezas", category: "Fruits", color: "#dc2626", article: "some" },
  { emoji: "🍋", en: "Lemon", es: "Limon", category: "Fruits", color: "#fde047", article: "a" },
  { emoji: "🥥", en: "Coconut", es: "Coco", category: "Fruits", color: "#a16207", article: "a" },
  { emoji: "🫐", en: "Blueberries", es: "Arandanos", category: "Fruits", color: "#3b82f6", article: "some" },
  { emoji: "🥕", en: "Carrot", es: "Zanahoria", category: "Vegetables", color: "#f97316", article: "a" },
  { emoji: "🍅", en: "Tomato", es: "Tomate", category: "Vegetables", color: "#ef4444", article: "a" },
  { emoji: "🥔", en: "Potato", es: "Papa", category: "Vegetables", color: "#ca8a04", article: "a" },
  { emoji: "🌽", en: "Corn", es: "Maiz", category: "Vegetables", color: "#facc15", article: "some" },
  { emoji: "🧅", en: "Onion", es: "Cebolla", category: "Vegetables", color: "#d8b4fe", article: "an" },
  { emoji: "🥬", en: "Lettuce", es: "Lechuga", category: "Vegetables", color: "#22c55e", article: "some" },
  { emoji: "🥦", en: "Broccoli", es: "Brocoli", category: "Vegetables", color: "#16a34a", article: "some" },
  { emoji: "🥒", en: "Cucumber", es: "Pepino", category: "Vegetables", color: "#65a30d", article: "a" },
  { emoji: "✏️", en: "Pencil", es: "Lapiz", category: "Classroom", color: "#facc15", article: "a" },
  { emoji: "📘", en: "Book", es: "Libro", category: "Classroom", color: "#2563eb", article: "a" },
  { emoji: "📓", en: "Notebook", es: "Cuaderno", category: "Classroom", color: "#38bdf8", article: "a" },
  { emoji: "🧽", en: "Eraser", es: "Borrador", category: "Classroom", color: "#fda4af", article: "an" },
  { emoji: "📏", en: "Ruler", es: "Regla", category: "Classroom", color: "#94a3b8", article: "a" },
  { emoji: "🪑", en: "Chair", es: "Silla", category: "Classroom", color: "#a16207", article: "a" },
  { emoji: "🎒", en: "Backpack", es: "Mochila", category: "Classroom", color: "#ef4444", article: "a" },
  { emoji: "✂️", en: "Scissors", es: "Tijeras", category: "Classroom", color: "#64748b", article: "some" },
  { emoji: "🐱", en: "Cat", es: "Gato", category: "Animals", color: "#fbbf24", article: "a" },
  { emoji: "🐶", en: "Dog", es: "Perro", category: "Animals", color: "#a16207", article: "a" },
  { emoji: "🐦", en: "Bird", es: "Pajaro", category: "Animals", color: "#38bdf8", article: "a" },
  { emoji: "🐟", en: "Fish", es: "Pez", category: "Animals", color: "#0ea5e9", article: "a" },
  { emoji: "🐰", en: "Rabbit", es: "Conejo", category: "Animals", color: "#f9a8d4", article: "a" },
  { emoji: "🦁", en: "Lion", es: "Leon", category: "Animals", color: "#f59e0b", article: "a" },
  { emoji: "🐵", en: "Monkey", es: "Mono", category: "Animals", color: "#92400e", article: "a" },
  { emoji: "🐘", en: "Elephant", es: "Elefante", category: "Animals", color: "#94a3b8", article: "an" },
  { emoji: "🔴", en: "Red", es: "Rojo", category: "Colors", color: "#ef4444", article: "the color" },
  { emoji: "🔵", en: "Blue", es: "Azul", category: "Colors", color: "#2563eb", article: "the color" },
  { emoji: "🟢", en: "Green", es: "Verde", category: "Colors", color: "#22c55e", article: "the color" },
  { emoji: "🟡", en: "Yellow", es: "Amarillo", category: "Colors", color: "#eab308", article: "the color" },
  { emoji: "🟣", en: "Purple", es: "Morado", category: "Colors", color: "#a855f7", article: "the color" },
  { emoji: "🏃", en: "Run", es: "Correr", category: "Actions", color: "#ef4444", article: "to" },
  { emoji: "🦘", en: "Jump", es: "Saltar", category: "Actions", color: "#f97316", article: "to" },
  { emoji: "📖", en: "Read", es: "Leer", category: "Actions", color: "#2563eb", article: "to" },
  { emoji: "✍️", en: "Write", es: "Escribir", category: "Actions", color: "#64748b", article: "to" },
  { emoji: "🎧", en: "Listen", es: "Escuchar", category: "Actions", color: "#14b8a6", article: "to" },
  { emoji: "🗣️", en: "Speak", es: "Hablar", category: "Actions", color: "#ec4899", article: "to" }
];

const hazards = [
  { emoji: "💣", en: "Bomb", es: "Bomba", color: "#111827", effect: "deadly", message: "hit a bomb" },
  { emoji: "☠️", en: "Poison", es: "Veneno", color: "#7f1d1d", effect: "deadly", message: "touched poison" },
  { emoji: "🦠", en: "Virus", es: "Virus", color: "#16a34a", effect: "penalty", points: 3, length: 12, message: "caught a virus" },
  { emoji: "🪨", en: "Rock", es: "Roca", color: "#64748b", effect: "penalty", points: 2, length: 9, message: "hit a rock" },
  { emoji: "🌶️", en: "Hot Pepper", es: "Chile picante", color: "#dc2626", effect: "penalty", points: 1, length: 7, message: "ate a hot pepper" }
];

const players = new Map();
const bots = new Map();
let foods = [];
let dangerItems = [];
let gameMode = "practice";
let paused = false;
let nextFoodId = 1;
let nextHazardId = 1;
let teamChallenge = null;

app.use(express.static(path.join(__dirname, "public")));

function cleanName(name) {
  return String(name || "Student")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH) || "Student";
}

function safeColor(color) {
  return allowedColors.includes(color) ? color : allowedColors[0];
}

function randomVocabulary() {
  return vocabulary[Math.floor(Math.random() * vocabulary.length)];
}

function createTeamChallenge() {
  const target = randomVocabulary();
  const goal = 4 + Math.floor(Math.random() * 4);
  return {
    id: Date.now() + "-" + Math.floor(Math.random() * 9999),
    target,
    goal,
    progress: {},
    winner: null,
    round: teamChallenge ? teamChallenge.round + 1 : 1
  };
}

function ensureTeamChallenge() {
  if (gameMode !== "teams") {
    teamChallenge = null;
    return;
  }
  if (!teamChallenge || teamChallenge.winner) teamChallenge = createTeamChallenge();
}

function randomPosition(margin = 120) {
  return {
    x: margin + Math.random() * (WORLD.w - margin * 2),
    y: margin + Math.random() * (WORLD.h - margin * 2)
  };
}

function makeFood() {
  return {
    id: nextFoodId++,
    ...randomPosition(90),
    r: 18 + Math.random() * 7,
    data: randomVocabulary(),
    bob: Math.random() * Math.PI * 2
  };
}

function makeHazard() {
  const data = hazards[Math.floor(Math.random() * hazards.length)];
  return {
    id: nextHazardId++,
    ...randomPosition(120),
    r: 20 + Math.random() * 9,
    data,
    bob: Math.random() * Math.PI * 2,
    pulse: Math.random() * Math.PI * 2
  };
}

function seedFood() {
  foods = Array.from({ length: FOOD_COUNT }, makeFood);
  dangerItems = Array.from({ length: HAZARD_COUNT }, makeHazard);
}

function makeSegments(x, y, angle, length) {
  const segments = [];
  for (let i = 0; i < length; i++) {
    segments.push({ x: x - Math.cos(angle) * i * 11, y: y - Math.sin(angle) * i * 11 });
  }
  return segments;
}

function makePlayer(socket, profile) {
  const pos = randomPosition(350);
  const angle = Math.random() * Math.PI * 2;
  return {
    id: socket.id,
    name: cleanName(profile.name),
    color: safeColor(profile.color),
    team: cleanName(profile.team || "Solo"),
    x: pos.x,
    y: pos.y,
    angle,
    desiredAngle: angle,
    baseLength: INITIAL_LENGTH,
    segments: makeSegments(pos.x, pos.y, angle, INITIAL_LENGTH),
    targetLength: INITIAL_LENGTH,
    score: 0,
    words: 0,
    isBot: false,
    boosting: false,
    alive: true,
    respawnAt: 0,
    lastInputAt: Date.now()
  };
}

function makeBot(index) {
  const pos = randomPosition(350);
  const angle = Math.random() * Math.PI * 2;
  const baseLength = BOT_INITIAL_LENGTH;
  return {
    id: `bot-${index}`,
    name: botNames[index % botNames.length],
    color: allowedColors[(index + 2) % allowedColors.length],
    team: "Bots",
    x: pos.x,
    y: pos.y,
    angle,
    desiredAngle: angle,
    baseLength,
    segments: makeSegments(pos.x, pos.y, angle, baseLength),
    targetLength: baseLength,
    score: 0,
    words: 0,
    isBot: true,
    boosting: false,
    alive: true,
    respawnAt: 0,
    lastInputAt: Date.now(),
    ai: {
      wander: Math.random() * Math.PI * 2,
      nextTurnAt: 0,
      vision: 760 + Math.random() * 360
    }
  };
}

function ensurePracticeBots() {
  if (gameMode !== "practice" || players.size !== 1) {
    bots.clear();
    return;
  }

  while (bots.size < PRACTICE_BOT_COUNT) {
    const index = bots.size;
    const bot = makeBot(index);
    bots.set(bot.id, bot);
    io.emit("classMessage", { text: `${bot.name} joined Practice Mode!`, kind: "bot" });
  }
}

function respawnPlayer(player) {
  const pos = randomPosition(350);
  player.x = pos.x;
  player.y = pos.y;
  player.angle = Math.random() * Math.PI * 2;
  player.desiredAngle = player.angle;
  player.score = 0;
  player.targetLength = player.baseLength || INITIAL_LENGTH;
  player.segments = makeSegments(player.x, player.y, player.angle, Math.floor(player.targetLength));
  player.alive = true;
  player.respawnAt = 0;
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b, x, y) {
  return Math.hypot(a - x, b - y);
}

function playerSpeed(player) {
  const cfg = modes[gameMode];
  const base = player.isBot ? cfg.baseSpeed * 0.92 : cfg.baseSpeed;
  return base + Math.min(cfg.maxSpeed - base, player.score * 3.8);
}

function updateBotAI(bot) {
  if (!bot.alive) return;

  const nearestHazard = dangerItems.reduce((nearest, item) => {
    const d = distance(bot.x, bot.y, item.x, item.y);
    return d < nearest.distance ? { item, distance: d } : nearest;
  }, { item: null, distance: Infinity });

  if (nearestHazard.item && nearestHazard.distance < 180) {
    bot.desiredAngle = Math.atan2(bot.y - nearestHazard.item.y, bot.x - nearestHazard.item.x);
    return;
  }

  let nearestFood = null;
  let bestDistance = Infinity;
  for (const food of foods) {
    const d = distance(bot.x, bot.y, food.x, food.y);
    if (d < bot.ai.vision && d < bestDistance) {
      nearestFood = food;
      bestDistance = d;
    }
  }

  if (nearestFood) {
    bot.desiredAngle = Math.atan2(nearestFood.y - bot.y, nearestFood.x - bot.x);
  } else if (Date.now() > bot.ai.nextTurnAt) {
    bot.ai.wander += (Math.random() - 0.5) * 1.15;
    bot.desiredAngle = bot.ai.wander;
    bot.ai.nextTurnAt = Date.now() + 800 + Math.random() * 1200;
  }

  const margin = 220;
  if (bot.x < margin) bot.desiredAngle = 0;
  if (bot.x > WORLD.w - margin) bot.desiredAngle = Math.PI;
  if (bot.y < margin) bot.desiredAngle = Math.PI / 2;
  if (bot.y > WORLD.h - margin) bot.desiredAngle = -Math.PI / 2;
}

function updatePlayer(player, dt) {
  const cfg = modes[gameMode];
  if (!player.alive) {
    if (Date.now() >= player.respawnAt) respawnPlayer(player);
    return;
  }

  const diff = normalizeAngle(player.desiredAngle - player.angle);
  player.angle += clamp(diff, -cfg.turnRate, cfg.turnRate);
  if (!player.isBot && Date.now() - player.lastInputAt > 350) player.boosting = false;
  const canBoost = player.boosting && player.targetLength > player.baseLength * 0.82;
  const speed = playerSpeed(player) * (canBoost ? BOOST_MULTIPLIER : 1);
  if (canBoost) player.targetLength = Math.max(player.baseLength * 0.82, player.targetLength - BOOST_LENGTH_COST * dt);
  player.x = clamp(player.x + Math.cos(player.angle) * speed * dt, 34, WORLD.w - 34);
  player.y = clamp(player.y + Math.sin(player.angle) * speed * dt, 34, WORLD.h - 34);
  player.segments.unshift({ x: player.x, y: player.y });
  while (player.segments.length > Math.floor(player.targetLength)) player.segments.pop();
}

function eatFood(player) {
  const cfg = modes[gameMode];
  for (let i = foods.length - 1; i >= 0; i--) {
    const food = foods[i];
    if (distance(player.x, player.y, food.x, food.y) < 35 + food.r) {
      foods.splice(i, 1, makeFood());
      player.score += 1;
      player.words += 1;
      player.targetLength += cfg.growth;
      const sentence = food.data.category === "Actions"
        ? `${player.name} learned: ${food.data.en}!`
        : `${player.name} ate ${food.data.article} ${food.data.en.toLowerCase()}!`;
      io.emit("foodEaten", { playerId: player.id, playerName: player.name, food: food.data, sentence });
      updateTeamChallenge(player, food.data);
    }
  }
}

function updateTeamChallenge(player, foodData) {
  if (gameMode !== "teams" || !teamChallenge || teamChallenge.winner) return;
  if (player.isBot || foodData.en !== teamChallenge.target.en) return;

  const team = player.team || "Solo";
  teamChallenge.progress[team] = (teamChallenge.progress[team] || 0) + 1;

  if (teamChallenge.progress[team] >= teamChallenge.goal) {
    teamChallenge.winner = team;
    for (const member of players.values()) {
      if (member.team === team) {
        member.score += 5;
        member.targetLength += 10;
      }
    }
    io.emit("teamChallengeWon", {
      team,
      target: teamChallenge.target,
      goal: teamChallenge.goal,
      sentence: `${team} completed the challenge: ${teamChallenge.goal} ${teamChallenge.target.en}!`
    });
    setTimeout(() => {
      if (gameMode === "teams") {
        teamChallenge = createTeamChallenge();
        io.emit("teamChallengeNew", { challenge: publicChallenge(), sentence: `New challenge: catch ${teamChallenge.goal} ${teamChallenge.target.en}!` });
      }
    }, 2600);
  } else {
    io.emit("teamChallengeProgress", { team, challenge: publicChallenge() });
  }
}

function hitHazards(player) {
  for (let i = dangerItems.length - 1; i >= 0; i--) {
    const item = dangerItems[i];
    if (distance(player.x, player.y, item.x, item.y) >= 35 + item.r) continue;

    dangerItems.splice(i, 1, makeHazard());
    if (item.data.effect === "deadly") {
      crashPlayer(player, item.data.message);
      io.emit("hazardHit", { playerId: player.id, playerName: player.name, hazard: item.data, sentence: `${player.name} ${item.data.message}!` });
      return;
    }

    player.score = Math.max(0, player.score - item.data.points);
    player.targetLength = Math.max(MIN_LENGTH, player.targetLength - item.data.length);
    io.emit("hazardHit", {
      playerId: player.id,
      playerName: player.name,
      hazard: item.data,
      sentence: `${player.name} ${item.data.message}: -${item.data.points} points!`
    });
  }
}

function crashPlayer(player, reason) {
  player.alive = false;
  player.respawnAt = Date.now() + 2200;
  player.score = 0;
  player.targetLength = player.baseLength || INITIAL_LENGTH;
  player.segments = [];
  io.emit("playerCrashed", { playerId: player.id, playerName: player.name, reason });
}

function defeatSnake(victim, winner) {
  const stolenPoints = Math.max(1, Math.ceil(victim.score * 0.5));

  winner.score += stolenPoints;
  winner.targetLength += Math.min(18, 5 + stolenPoints * 2);
  victim.score = 0;
  victim.targetLength = victim.baseLength || INITIAL_LENGTH;
  victim.alive = false;
  victim.respawnAt = Date.now() + (victim.isBot ? 1800 : 2400);
  victim.segments = [];

  io.emit("snakeDefeated", {
    victimId: victim.id,
    victimName: victim.name,
    winnerId: winner.id,
    winnerName: winner.name,
    stolenPoints,
    sentence: `${winner.name} trapped ${victim.name} and stole ${stolenPoints} points!`
  });
}

function handleCollisions() {
  const cfg = modes[gameMode];
  const practiceBotCombat = gameMode === "practice" && bots.size > 0;
  if (!cfg.collision && !practiceBotCombat) return;

  const active = [...players.values(), ...bots.values()].filter((player) => player.alive);
  for (const attacker of active) {
    for (const defender of active) {
      if (attacker.id === defender.id) continue;
      if (practiceBotCombat && !attacker.isBot && !defender.isBot) continue;

      for (let i = 9; i < defender.segments.length; i += 3) {
        const segment = defender.segments[i];
        if (distance(attacker.x, attacker.y, segment.x, segment.y) < 28) {
          defeatSnake(attacker, defender);
          return;
        }
      }
    }
  }
}

function teamScores() {
  const totals = {};
  for (const player of [...players.values(), ...bots.values()]) {
    if (gameMode !== "teams") continue;
    totals[player.team] = (totals[player.team] || 0) + player.score;
  }
  return Object.entries(totals)
    .map(([team, score]) => ({ team, score }))
    .sort((a, b) => b.score - a.score);
}

function publicChallenge() {
  if (!teamChallenge) return null;
  return {
    id: teamChallenge.id,
    round: teamChallenge.round,
    target: teamChallenge.target,
    goal: teamChallenge.goal,
    progress: teamChallenge.progress,
    winner: teamChallenge.winner
  };
}

function publicState() {
  const publicPlayers = [...players.values(), ...bots.values()].map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    team: player.team,
    x: player.x,
    y: player.y,
    angle: player.angle,
    boosting: player.boosting,
    segments: player.segments,
    score: player.score,
    words: player.words,
    length: Math.floor(player.targetLength),
    isBot: player.isBot,
    alive: player.alive,
    respawnMs: player.alive ? 0 : Math.max(0, player.respawnAt - Date.now())
  }));

  return {
    world: WORLD,
    mode: gameMode,
    modeLabel: modes[gameMode].label,
    paused,
    players: publicPlayers,
    foods,
    hazards: dangerItems,
    leaderboard: publicPlayers.slice().sort((a, b) => b.score - a.score).slice(0, 8),
    teams: teamScores(),
    challenge: publicChallenge(),
    playerCount: publicPlayers.length,
    humanCount: players.size,
    botCount: bots.size
  };
}

function tick() {
  ensurePracticeBots();
  ensureTeamChallenge();
  if (paused) {
    io.emit("gameState", publicState());
    return;
  }

  const dt = 1 / TICK_RATE;
  for (const bot of bots.values()) updateBotAI(bot);
  for (const player of [...players.values(), ...bots.values()]) {
    updatePlayer(player, dt);
    if (player.alive) {
      eatFood(player);
      if (player.alive) hitHazards(player);
    }
  }
  handleCollisions();
  io.emit("gameState", publicState());
}

io.on("connection", (socket) => {
  socket.emit("welcome", { id: socket.id, colors: allowedColors, modes: Object.keys(modes), vocabularyCount: vocabulary.length });

  socket.on("joinGame", (profile = {}) => {
    const previous = players.get(socket.id);
    if (previous) io.emit("classMessage", { text: `${previous.name} changed settings.`, kind: "settings" });
    if (profile.mode && modes[profile.mode]) gameMode = profile.mode;
    const player = makePlayer(socket, profile);
    players.set(socket.id, player);
    socket.emit("joined", { id: socket.id, world: WORLD });
    io.emit("classMessage", { text: `${player.name} joined the game!`, kind: "join" });
  });

  socket.on("playerInput", (input = {}) => {
    const player = players.get(socket.id);
    if (!player) return;
    if (paused) return;
    const now = Date.now();
    if (now - player.lastInputAt < 16) return;
    player.lastInputAt = now;
    const angle = Number(input.angle);
    if (Number.isFinite(angle)) player.desiredAngle = angle;
    player.boosting = input.boosting === true;
  });

  socket.on("setMode", (mode) => {
    if (!modes[mode]) return;
    gameMode = mode;
    ensureTeamChallenge();
    io.emit("classMessage", { text: `Mode changed to ${modes[mode].label}.`, kind: "mode" });
    if (teamChallenge) io.emit("teamChallengeNew", { challenge: publicChallenge(), sentence: `Team challenge: catch ${teamChallenge.goal} ${teamChallenge.target.en}!` });
  });

  socket.on("togglePause", () => {
    paused = !paused;
    io.emit("pauseChanged", { paused });
    io.emit("classMessage", { text: paused ? "Game paused. Scores are saved." : "Game resumed.", kind: "pause" });
  });

  socket.on("leaveGame", () => {
    const player = players.get(socket.id);
    if (!player) return;
    players.delete(socket.id);
    socket.emit("leftGame");
    io.emit("classMessage", { text: `${player.name} returned to settings.`, kind: "leave" });
  });

  socket.on("disconnect", () => {
    const player = players.get(socket.id);
    if (player) io.emit("classMessage", { text: `${player.name} left the game.`, kind: "leave" });
    players.delete(socket.id);
  });
});

function getLocalAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) addresses.push(net.address);
    }
  }
  return addresses;
}

seedFood();
setInterval(tick, 1000 / TICK_RATE);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Slither English Multiplayer running on http://localhost:${PORT}`);
  for (const address of getLocalAddresses()) {
    console.log(`Classroom URL: http://${address}:${PORT}`);
  }
});
