const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const joinScreen = document.getElementById("joinScreen");
const joinForm = document.getElementById("joinForm");
const nameInput = document.getElementById("nameInput");
const colorSelect = document.getElementById("colorSelect");
const teamSelect = document.getElementById("teamSelect");
const joinModeSelect = document.getElementById("joinModeSelect");
const modeSelect = document.getElementById("modeSelect");
const modeBtn = document.getElementById("modeBtn");
const settingsBtn = document.getElementById("settingsBtn");
const pauseBtn = document.getElementById("pauseBtn");
const speakBtn = document.getElementById("speakBtn");
const scoreEl = document.getElementById("score");
const lengthEl = document.getElementById("length");
const playersEl = document.getElementById("players");
const modeLabelEl = document.getElementById("modeLabel");
const leaderboardRows = document.getElementById("leaderboardRows");
const teamScoresEl = document.getElementById("teamScores");
const challengeText = document.getElementById("challengeText");
const challengeProgress = document.getElementById("challengeProgress");
const wordEmojiEl = document.getElementById("wordEmoji");
const wordEl = document.getElementById("word");
const meaningEl = document.getElementById("meaning");
const sentenceEl = document.getElementById("sentence");
const toastEl = document.getElementById("toast");
const joinIntro = document.getElementById("joinIntro");
const joinSubmit = document.getElementById("joinSubmit");

let width = innerWidth;
let height = innerHeight;
let dpr = Math.min(devicePixelRatio || 1, 2);
let myId = null;
let state = null;
let camera = { x: 0, y: 0 };
let pointer = { x: width / 2, y: height / 2 };
let boosting = false;
let cameraReady = false;
let lastWord = "Let's play!";
let particles = [];

function resize() {
  width = innerWidth;
  height = innerHeight;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function speak(text) {
  lastWord = text;
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.78;
  utterance.pitch = 1.04;
  speechSynthesis.speak(utterance);
}

function playPointSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const audio = playPointSound.audio || new AudioContext();
  playPointSound.audio = audio;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(680, now);
  oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.13);
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toastEl.classList.remove("show"), 2100);
}

function setPointer(clientX, clientY) {
  pointer.x = clientX;
  pointer.y = clientY;
}

function me() {
  if (!state) return null;
  return state.players.find((player) => player.id === myId) || null;
}

function sendInput() {
  if (!myId) return;
  if (state && state.paused) return;
  if (!cameraReady || document.hidden || !document.hasFocus()) return;
  const player = me();
  if (!player || !state) return;
  const worldX = camera.x + pointer.x;
  const worldY = camera.y + pointer.y;
  const angle = Math.atan2(worldY - player.y, worldX - player.x);
  socket.emit("playerInput", { angle, boosting });
}

function openSettings() {
  if (myId) socket.emit("leaveGame");
  myId = null;
  cameraReady = false;
  boosting = false;
  particles = [];
  joinModeSelect.value = modeSelect.value;
  joinIntro.textContent = "Cambia tu nombre, color, equipo o modo y vuelve a entrar.";
  joinSubmit.textContent = "Rejoin Game";
  joinScreen.classList.remove("hidden");
  wordEmojiEl.textContent = "⚙️";
  wordEl.textContent = "Settings";
  meaningEl.textContent = "Configuracion";
  sentenceEl.textContent = "Choose your options and rejoin the game.";
  showToast("Settings opened");
}

function updateCamera() {
  const player = me();
  if (!player || !state) return;
  if (!cameraReady) {
    camera.x = clamp(player.x - width / 2, 0, Math.max(0, state.world.w - width));
    camera.y = clamp(player.y - height / 2, 0, Math.max(0, state.world.h - height));
    pointer.x = width / 2 + Math.cos(player.angle) * 180;
    pointer.y = height / 2 + Math.sin(player.angle) * 180;
    cameraReady = true;
    return;
  }
  camera.x += (player.x - width / 2 - camera.x) * 0.18;
  camera.y += (player.y - height / 2 - camera.y) * 0.18;
  camera.x = clamp(camera.x, 0, Math.max(0, state.world.w - width));
  camera.y = clamp(camera.y, 0, Math.max(0, state.world.h - height));
}

function drawWorld() {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#082f49");
  bg.addColorStop(.5, "#064e3b");
  bg.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (!state) return;
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  const grid = 90;
  ctx.strokeStyle = "rgba(255,255,255,.055)";
  ctx.lineWidth = 1;
  const startX = Math.floor(camera.x / grid) * grid;
  const endX = camera.x + width + grid;
  const startY = Math.floor(camera.y / grid) * grid;
  const endY = camera.y + height + grid;
  for (let x = startX; x < endX; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, camera.y - 90);
    ctx.lineTo(x, camera.y + height + 90);
    ctx.stroke();
  }
  for (let y = startY; y < endY; y += grid) {
    ctx.beginPath();
    ctx.moveTo(camera.x - 90, y);
    ctx.lineTo(camera.x + width + 90, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 10;
  ctx.shadowColor = "rgba(56,189,248,.42)";
  ctx.shadowBlur = 20;
  roundRect(ctx, 20, 20, state.world.w - 40, state.world.h - 40, 34, false, true);
  ctx.restore();

  const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .25, width / 2, height / 2, Math.max(width, height) * .72);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawFoods(timestamp) {
  if (!state) return;
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (const food of state.foods) {
    const sx = food.x - camera.x;
    const sy = food.y - camera.y;
    if (sx < -90 || sx > width + 90 || sy < -90 || sy > height + 90) continue;
    const bob = Math.sin(timestamp * .003 + food.bob) * 3;
    ctx.save();
    ctx.translate(food.x, food.y + bob);
    ctx.shadowColor = "rgba(0,0,0,.42)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    const orb = ctx.createRadialGradient(-food.r * .32, -food.r * .42, 2, 0, 0, food.r * 1.25);
    orb.addColorStop(0, "rgba(255,255,255,.9)");
    orb.addColorStop(.18, "rgba(255,255,255,.22)");
    orb.addColorStop(1, "rgba(0,0,0,.2)");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(0, 0, food.r * 1.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${food.r * 1.42}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(food.data.emoji, 0, 1);
    ctx.restore();
  }
  ctx.restore();
}

function drawHazards(timestamp) {
  if (!state) return;
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (const item of state.hazards || []) {
    const sx = item.x - camera.x;
    const sy = item.y - camera.y;
    if (sx < -100 || sx > width + 100 || sy < -100 || sy > height + 100) continue;
    const pulse = 1 + Math.sin(timestamp * .006 + item.pulse) * .08;
    const bob = Math.sin(timestamp * .004 + item.bob) * 4;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = item.data.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = item.data.effect === "deadly" ? "rgba(127, 29, 29, .86)" : "rgba(120, 53, 15, .82)";
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, item.r * 1.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = `${item.r * 1.35}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.data.emoji, 0, 1);
    ctx.restore();
  }
  ctx.restore();
}

function drawPlayers() {
  if (!state) return;
  for (const player of state.players) drawSnake(player);
}

function drawSnake(player) {
  if (!player.alive) {
    drawRespawn(player);
    return;
  }
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (let i = player.segments.length - 1; i >= 0; i--) {
    const segment = player.segments[i];
    const ratio = i / Math.max(1, player.segments.length);
    const radius = 18 * (1 - ratio * .35) + Math.sin(performance.now() * .004 + i * .22) * .55;
    const grad = ctx.createRadialGradient(segment.x - radius * .35, segment.y - radius * .45, 2, segment.x, segment.y, radius * 1.2);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(.26, player.color);
    grad.addColorStop(1, shade(player.color, -44));
    ctx.shadowColor = "rgba(0,0,0,.34)";
    ctx.shadowBlur = i === 0 ? (player.boosting ? 30 : 18) : 10;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.23)";
    ctx.beginPath();
    ctx.arc(segment.x - radius * .32, segment.y - radius * .38, radius * .22, 0, Math.PI * 2);
    ctx.fill();
  }
  drawFace(player);
  if (player.boosting) drawBoostFlame(player);
  drawNameTag(player);
  ctx.restore();
}

function drawBoostFlame(player) {
  const a = player.angle + Math.PI;
  const x = player.x + Math.cos(a) * 24;
  const y = player.y + Math.sin(a) * 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(player.angle);
  ctx.fillStyle = "rgba(250, 204, 21, .9)";
  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-12, -9);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-12, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFace(player) {
  const a = player.angle;
  const fx = Math.cos(a);
  const fy = Math.sin(a);
  const px = -Math.sin(a);
  const py = Math.cos(a);
  const eyeX = player.x + fx * 11;
  const eyeY = player.y + fy * 11;
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.arc(eyeX + px * 7, eyeY + py * 7, 5.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeX - px * 7, eyeY - py * 7, 5.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.beginPath(); ctx.arc(eyeX + px * 7 + fx * 1.7, eyeY + py * 7 + fy * 1.7, 2.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeX - px * 7 + fx * 1.7, eyeY - py * 7 + fy * 1.7, 2.3, 0, Math.PI * 2); ctx.fill();
}

function drawNameTag(player) {
  const label = player.isBot ? "CPU" : player.id === myId ? "You" : "";
  const text = label ? `${player.name} (${label}) ${player.score}` : `${player.name} ${player.score}`;
  ctx.save();
  ctx.font = "850 15px Segoe UI, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width + 24;
  const y = player.y - 42;
  ctx.fillStyle = player.id === myId ? "rgba(22,163,74,.82)" : player.isBot ? "rgba(124,45,18,.8)" : "rgba(15,23,42,.76)";
  ctx.strokeStyle = "rgba(255,255,255,.24)";
  ctx.lineWidth = 1;
  roundRect(ctx, player.x - w / 2, y - 14, w, 28, 14, true, true);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, player.x, y);
  ctx.restore();
}

function drawRespawn(player) {
  if (player.id !== myId) return;
  const seconds = Math.ceil(player.respawnMs / 1000);
  drawCenterText("Respawning", `${seconds}s`);
}

function drawParticles() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    p.r *= .985;
    ctx.globalAlpha = Math.max(0, p.life / 42);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    if (p.life <= 0 || p.r < .5) particles.splice(i, 1);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function burst(x, y, color, count = 36) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 28 + Math.random() * 24, r: 3 + Math.random() * 5 });
  }
}

function drawCenterText(title, subtitle) {
  ctx.save();
  ctx.fillStyle = "rgba(2,6,23,.48)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#ffffff";
  ctx.font = "1000 52px Segoe UI, system-ui";
  ctx.fillText(title, width / 2, height / 2 - 28);
  ctx.fillStyle = "#dbeafe";
  ctx.font = "850 24px Segoe UI, system-ui";
  ctx.fillText(subtitle, width / 2, height / 2 + 34);
  ctx.restore();
}

function render(timestamp) {
  sendInput();
  updateCamera();
  drawWorld();
  drawFoods(timestamp);
  drawHazards(timestamp);
  drawParticles();
  drawPlayers();
  if (!myId) drawCenterText("Slither English", "Join the classroom game");
  else if (state && state.paused) drawCenterText("Paused", "Scores are saved");
  requestAnimationFrame(render);
}

function updateUi() {
  const player = me();
  if (!state) return;
  scoreEl.textContent = player ? player.score : 0;
  lengthEl.textContent = player ? player.length : 0;
  playersEl.textContent = state.playerCount;
  modeLabelEl.textContent = state.modeLabel;
  modeSelect.value = state.mode;
  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  leaderboardRows.innerHTML = state.leaderboard.map((row, index) => `
    <div class="rank-row ${row.id === myId ? "me" : ""} ${row.isBot ? "bot" : ""}">
      <span>${index + 1}. ${escapeHtml(row.name)}${row.isBot ? " CPU" : ""}</span>
      <span>${row.score}</span>
    </div>
  `).join("");
  teamScoresEl.innerHTML = state.teams.map((row) => `
    <div class="team-row"><span>${escapeHtml(row.team)}</span><span>${row.score}</span></div>
  `).join("");
  updateChallengeUi(state.challenge);
}

function updateChallengeUi(challenge) {
  if (!challenge) {
    challengeText.textContent = "Switch to Teams";
    challengeProgress.innerHTML = "";
    return;
  }

  challengeText.innerHTML = `
    <div class="challenge-target"><span>${challenge.target.emoji}</span> Catch ${challenge.goal} ${escapeHtml(challenge.target.en)}</div>
  `;
  const entries = Object.entries(challenge.progress || {});
  challengeProgress.innerHTML = entries.length
    ? entries.map(([team, count]) => `<div class="challenge-progress">${escapeHtml(team)}: ${count}/${challenge.goal}</div>`).join("")
    : `<div class="challenge-progress">No progress yet</div>`;
}

function populateColors(colors) {
  colorSelect.innerHTML = colors.map((color) => `<option value="${color}" style="background:${color}">${color}</option>`).join("");
}

function roundRect(c, x, y, w, h, r, fill, stroke) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
  if (fill) c.fill();
  if (stroke) c.stroke();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function shade(hex, amount) {
  const value = hex.replace("#", "");
  const number = parseInt(value, 16);
  const r = clamp((number >> 16) + amount, 0, 255);
  const g = clamp(((number >> 8) & 255) + amount, 0, 255);
  const b = clamp((number & 255) + amount, 0, 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

addEventListener("resize", resize);
addEventListener("mousemove", (event) => setPointer(event.clientX, event.clientY));
addEventListener("mousedown", (event) => {
  boosting = true;
  setPointer(event.clientX, event.clientY);
});
addEventListener("mouseup", () => {
  boosting = false;
});
addEventListener("blur", () => {
  boosting = false;
});
addEventListener("visibilitychange", () => {
  if (document.hidden) boosting = false;
});
addEventListener("keydown", (event) => {
  if (event.key === "Escape") openSettings();
  if (event.key.toLowerCase() === "p") socket.emit("togglePause");
});
canvas.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  boosting = true;
  setPointer(touch.clientX, touch.clientY);
}, { passive: true });
canvas.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  setPointer(touch.clientX, touch.clientY);
}, { passive: true });
canvas.addEventListener("touchend", () => {
  boosting = false;
}, { passive: true });
canvas.addEventListener("mouseleave", () => {
  boosting = false;
});

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  socket.emit("joinGame", {
    name: nameInput.value,
    color: colorSelect.value,
    team: teamSelect.value,
    mode: joinModeSelect.value
  });
  joinScreen.classList.add("hidden");
});

modeBtn.addEventListener("click", () => socket.emit("setMode", modeSelect.value));
pauseBtn.addEventListener("click", () => socket.emit("togglePause"));
settingsBtn.addEventListener("click", openSettings);
speakBtn.addEventListener("click", () => speak(lastWord));

socket.on("welcome", (payload) => populateColors(payload.colors));
socket.on("joined", (payload) => {
  myId = payload.id;
  cameraReady = false;
  showToast("You joined the game!");
  speak("Let's play!");
});
socket.on("leftGame", () => {
  myId = null;
  cameraReady = false;
  boosting = false;
  updateUi();
});
socket.on("gameState", (payload) => {
  state = payload;
  updateUi();
});
socket.on("pauseChanged", ({ paused }) => {
  if (state) state.paused = paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
});
socket.on("foodEaten", ({ playerId, playerName, food, sentence }) => {
  wordEmojiEl.textContent = food.emoji;
  wordEl.textContent = food.en;
  meaningEl.textContent = `${food.es} · ${food.category}`;
  sentenceEl.textContent = sentence;
  showToast(sentence);
  if (playerId === myId) speak(food.en);
  else playPointSound();
  const player = state && state.players.find((item) => item.id === playerId);
  if (player) burst(player.x, player.y, food.color, playerId === myId ? 55 : 28);
});
socket.on("playerCrashed", ({ playerId, playerName, reason }) => {
  showToast(`${playerName} ${reason}!`);
  sentenceEl.textContent = `${playerName} needs to try again.`;
  if (playerId === myId) speak("Try again!");
  else playPointSound();
});
socket.on("snakeDefeated", ({ victimName, winnerId, winnerName, stolenPoints, sentence }) => {
  wordEmojiEl.textContent = "🏆";
  wordEl.textContent = "Trap!";
  meaningEl.textContent = `${winnerName} defeated ${victimName}`;
  sentenceEl.textContent = sentence;
  showToast(sentence);
  if (winnerId === myId) speak("Great trap!");
  else playPointSound();
  const winner = state && state.players.find((item) => item.id === winnerId);
  if (winner) burst(winner.x, winner.y, winner.color, 45 + stolenPoints * 4);
});
socket.on("hazardHit", ({ playerId, hazard, sentence }) => {
  wordEmojiEl.textContent = hazard.emoji;
  wordEl.textContent = hazard.en;
  meaningEl.textContent = `${hazard.es} · Danger`;
  sentenceEl.textContent = sentence;
  showToast(sentence);
  if (playerId === myId) speak(hazard.effect === "deadly" ? "Danger!" : "Be careful!");
  else playPointSound();
  const player = state && state.players.find((item) => item.id === playerId);
  if (player) burst(player.x, player.y, hazard.color, hazard.effect === "deadly" ? 80 : 45);
});
socket.on("teamChallengeProgress", ({ challenge }) => updateChallengeUi(challenge));
socket.on("teamChallengeNew", ({ challenge, sentence }) => {
  updateChallengeUi(challenge);
  showToast(sentence);
  wordEmojiEl.textContent = challenge.target.emoji;
  wordEl.textContent = "Team Challenge";
  meaningEl.textContent = `Catch ${challenge.goal} ${challenge.target.en}`;
  sentenceEl.textContent = sentence;
  speak(challenge.target.en);
});
socket.on("teamChallengeWon", ({ team, target, sentence }) => {
  showToast(sentence);
  wordEmojiEl.textContent = "🏁";
  wordEl.textContent = `${team} wins!`;
  meaningEl.textContent = target.en;
  sentenceEl.textContent = sentence;
  speak("Challenge complete!");
});
socket.on("classMessage", ({ text }) => showToast(text));

resize();
requestAnimationFrame(render);
