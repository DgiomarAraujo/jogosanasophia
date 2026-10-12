const PASSWORD = "estrela";
const IMAGE_SRC = "assets/foto.jpg";

const gate = document.getElementById("gate");
const game = document.getElementById("game");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordMessage = document.getElementById("passwordMessage");
const canvas = document.getElementById("puzzle");
const ctx = canvas.getContext("2d");
const celebrationCanvas = document.getElementById("celebration");
const celebrationCtx = celebrationCanvas.getContext("2d");
const movesEl = document.getElementById("moves");
const levelText = document.getElementById("levelText");
const levelSelect = document.getElementById("levelSelect");
const resetButton = document.getElementById("resetButton");
const hintButton = document.getElementById("hintButton");
const completeBanner = document.getElementById("completeBanner");
const taskFinish = document.getElementById("taskFinish");
const taskMoves = document.getElementById("taskMoves");
const taskReplay = document.getElementById("taskReplay");

let size = Number(levelSelect.value);
let tiles = [];
let blankIndex = 0;
let moves = 0;
let completedRounds = 0;
let solved = false;
let hintActive = false;
let celebrationParticles = [];

const image = new Image();
image.src = IMAGE_SRC;
image.addEventListener("load", startGame);

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const typed = passwordInput.value.trim().toLowerCase();
  if (typed === PASSWORD.toLowerCase()) {
    gate.classList.add("is-hidden");
    game.classList.remove("is-hidden");
    passwordMessage.textContent = "";
    draw();
  } else {
    passwordMessage.textContent = "Senha incorreta. Tente de novo.";
    passwordInput.select();
  }
});

levelSelect.addEventListener("change", () => {
  size = Number(levelSelect.value);
  levelText.textContent = size === 3 ? "Facil" : size === 4 ? "Medio" : "Dificil";
  startGame();
});

resetButton.addEventListener("click", startGame);
hintButton.addEventListener("click", showHint);
canvas.addEventListener("click", handleCanvasClick);

function startGame() {
  tiles = Array.from({ length: size * size }, (_, index) => index);
  blankIndex = tiles.length - 1;
  moves = 0;
  solved = false;
  hintActive = false;
  completeBanner.classList.add("is-hidden");
  movesEl.textContent = "0";
  taskFinish.classList.remove("done");
  taskMoves.classList.remove("done");
  shuffleByMoves(140 + size * 40);
  draw();
}

function shuffleByMoves(count) {
  let previousBlank = -1;
  for (let i = 0; i < count; i += 1) {
    const neighbors = getNeighborIndexes(blankIndex).filter((index) => index !== previousBlank);
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    previousBlank = blankIndex;
    swap(blankIndex, next);
    blankIndex = next;
  }
}

function handleCanvasClick(event) {
  if (solved || hintActive) return;

  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const x = (event.clientX - rect.left) * scale;
  const y = (event.clientY - rect.top) * scale;
  const col = Math.floor(x / (canvas.width / size));
  const row = Math.floor(y / (canvas.height / size));
  const clickedIndex = row * size + col;

  if (!getNeighborIndexes(blankIndex).includes(clickedIndex)) return;

  swap(blankIndex, clickedIndex);
  blankIndex = clickedIndex;
  moves += 1;
  movesEl.textContent = String(moves);
  draw();

  if (isSolved()) {
    finishRound();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (hintActive) {
    drawImageCover(0, 0, canvas.width, canvas.height);
    drawGrid();
    return;
  }

  const tileSize = canvas.width / size;
  tiles.forEach((tileValue, index) => {
    if (tileValue === tiles.length - 1) {
      drawBlank(index, tileSize);
      return;
    }

    const sourceCol = tileValue % size;
    const sourceRow = Math.floor(tileValue / size);
    const targetCol = index % size;
    const targetRow = Math.floor(index / size);

    drawImageCoverPiece(sourceCol, sourceRow, targetCol, targetRow, tileSize);

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 4;
    ctx.strokeRect(targetCol * tileSize, targetRow * tileSize, tileSize, tileSize);
  });
}

function drawBlank(index, tileSize) {
  const col = index % size;
  const row = Math.floor(index / size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
  ctx.fillStyle = "#dff4ff";
  ctx.fillRect(col * tileSize + 10, row * tileSize + 10, tileSize - 20, tileSize - 20);
}

function drawGrid() {
  const tileSize = canvas.width / size;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  for (let i = 1; i < size; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }
}

function getCoverSource() {
  const sourceSize = Math.min(image.width, image.height);
  const sourceX = (image.width - sourceSize) / 2;
  const sourceY = (image.height - sourceSize) / 2;
  return { sourceX, sourceY, sourceSize };
}

function drawImageCover(x, y, width, height) {
  const { sourceX, sourceY, sourceSize } = getCoverSource();
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, x, y, width, height);
}

function drawImageCoverPiece(sourceCol, sourceRow, targetCol, targetRow, tileSize) {
  const { sourceX, sourceY, sourceSize } = getCoverSource();
  const sourceTile = sourceSize / size;
  ctx.drawImage(
    image,
    sourceX + sourceCol * sourceTile,
    sourceY + sourceRow * sourceTile,
    sourceTile,
    sourceTile,
    targetCol * tileSize,
    targetRow * tileSize,
    tileSize,
    tileSize
  );
}

function showHint() {
  if (solved || hintActive) return;
  hintActive = true;
  draw();
  setTimeout(() => {
    hintActive = false;
    draw();
  }, 3000);
}

function finishRound() {
  solved = true;
  completedRounds += 1;
  taskFinish.classList.add("done");
  if (moves <= 80) taskMoves.classList.add("done");
  if (completedRounds >= 2) taskReplay.classList.add("done");
  completeBanner.classList.remove("is-hidden");
  drawFullImage();
  playApplause();
  launchCelebration();
}

function drawFullImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawImageCover(0, 0, canvas.width, canvas.height);
}

function isSolved() {
  return tiles.every((tileValue, index) => tileValue === index);
}

function getNeighborIndexes(index) {
  const col = index % size;
  const row = Math.floor(index / size);
  const neighbors = [];
  if (row > 0) neighbors.push(index - size);
  if (row < size - 1) neighbors.push(index + size);
  if (col > 0) neighbors.push(index - 1);
  if (col < size - 1) neighbors.push(index + 1);
  return neighbors;
}

function swap(first, second) {
  [tiles[first], tiles[second]] = [tiles[second], tiles[first]];
}

function playApplause() {
  const audio = new AudioContext();
  const now = audio.currentTime;
  for (let i = 0; i < 26; i += 1) {
    const delay = i * 0.055;
    const noise = audio.createBufferSource();
    const buffer = audio.createBuffer(1, audio.sampleRate * 0.08, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < data.length; j += 1) data[j] = Math.random() * 2 - 1;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.08);
    noise.buffer = buffer;
    noise.connect(gain).connect(audio.destination);
    noise.start(now + delay);
    noise.stop(now + delay + 0.09);
  }
}

function launchCelebration() {
  resizeCelebrationCanvas();
  celebrationParticles = Array.from({ length: 160 }, () => ({
    x: Math.random() * celebrationCanvas.width,
    y: celebrationCanvas.height + Math.random() * 120,
    vx: (Math.random() - 0.5) * 7,
    vy: -Math.random() * 13 - 7,
    gravity: 0.24 + Math.random() * 0.08,
    size: 4 + Math.random() * 7,
    color: ["#e34f7c", "#168c7e", "#f9b642", "#4b83f1", "#ffffff"][Math.floor(Math.random() * 5)],
    life: 120 + Math.random() * 60
  }));
  requestAnimationFrame(animateCelebration);
}

function animateCelebration() {
  celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
  celebrationParticles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.life -= 1;
    celebrationCtx.fillStyle = particle.color;
    celebrationCtx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  celebrationParticles = celebrationParticles.filter((particle) => particle.life > 0);
  if (celebrationParticles.length > 0) requestAnimationFrame(animateCelebration);
}

function resizeCelebrationCanvas() {
  celebrationCanvas.width = window.innerWidth;
  celebrationCanvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCelebrationCanvas);
resizeCelebrationCanvas();
