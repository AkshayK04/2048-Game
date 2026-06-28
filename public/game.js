
// ==========================
// SOUNDS
// ==========================
const moveSound = new Audio("sounds/swipe.mp3");
const mergeSound = new Audio("sounds/transition.mp3");
const gameOverSound = new Audio("sounds/pop.mp3");
const clickSound = new Audio("sounds/click.mp3");

// ==========================
// HELPERS
// ==========================
function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

function vibrate(pattern) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}

// ==========================
// DOM ELEMENTS
// ==========================
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");

const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const newGameBtn = document.getElementById("newGameBtn");

// ==========================
// GAME STATE
// ==========================
let board = [];
let score = 0;
let bestScore = 0;
let locked = false;
let gameOverShown = false;
let prevBoard = [];

// ==========================
// INIT
// ==========================
function init() {
    board = Array.from({ length: 4 }, () => Array(4).fill(0));
    prevBoard = Array.from({ length: 4 }, () => Array(4).fill(0));
}

// ==========================
// RANDOM TILE
// ==========================
function addTile() {
    let empty = [];

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) {
                empty.push({ r, c });
            }
        }
    }

    if (empty.length === 0) return;

    const cell = empty[Math.floor(Math.random() * empty.length)];
    board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
}

// ==========================
// PARTICLES (simple kept)
// ==========================
function createParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "particle";

        p.style.left = x + "px";
        p.style.top = y + "px";

        document.body.appendChild(p);

        setTimeout(() => p.remove(), 600);
    }
}

// ==========================
// COMPRESS + MERGE
// ==========================
function compress(row) {
    let arr = row.filter(v => v !== 0);
    let merged = [false, false, false, false];

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1] && !merged[i] && !merged[i + 1]) {
            arr[i] *= 2;
            score += arr[i];

            playSound(mergeSound);
            vibrate(30);

            arr[i + 1] = 0;
            merged[i] = true;
        }
    }

    arr = arr.filter(v => v !== 0);

    while (arr.length < 4) arr.push(0);

    return arr;
}

// ==========================
// MOVES
// ==========================
function moveLeft() {
    for (let r = 0; r < 4; r++) {
        board[r] = compress(board[r]);
    }
}

function moveRight() {
    for (let r = 0; r < 4; r++) {
        board[r] = compress([...board[r]].reverse()).reverse();
    }
}

function moveUp() {
    for (let c = 0; c < 4; c++) {
        let col = [];
        for (let r = 0; r < 4; r++) col.push(board[r][c]);
        col = compress(col);
        for (let r = 0; r < 4; r++) board[r][c] = col[r];
    }
}

function moveDown() {
    for (let c = 0; c < 4; c++) {
        let col = [];
        for (let r = 0; r < 4; r++) col.push(board[r][c]);
        col = compress([...col].reverse()).reverse();
        for (let r = 0; r < 4; r++) board[r][c] = col[r];
    }
}

// ==========================
// DRAW
// ==========================
function draw() {
    boardEl.innerHTML = "";

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const tile = document.createElement("div");
            tile.className = "tile";

            const value = board[r][c];

            if (value !== 0) {
                tile.textContent = value;
                tile.dataset.value = value;
            }

            if (value !== 0 && (!prevBoard[r] || prevBoard[r][c] === 0)) {
                tile.classList.add("spawn");
            }

            if (value === 2048 && !gameOverShown) {
                setTimeout(() => {
                    gameOverShown = true;
                    finalScoreEl.textContent = score;
                    gameOverEl.classList.remove("hidden");
                    gameOverEl.querySelector("h2").textContent = "You Win! 🎉";
                }, 200);
            }

            boardEl.appendChild(tile);
        }
    }

    prevBoard = board.map(row => [...row]);

    scoreEl.textContent = score;

    if (score > bestScore) bestScore = score;
    bestScoreEl.textContent = bestScore;
}

// ==========================
// PLAY MOVE
// ==========================
function play(move) {
    if (locked) return;

    const oldBoard = JSON.stringify(board);

    move();

    if (oldBoard === JSON.stringify(board)) return;

    playSound(moveSound);
    vibrate(20);

    addTile();

    draw();
    saveGame();

    if (!canMove() && !gameOverShown) {
        gameOverShown = true;
        finalScoreEl.textContent = score;
        gameOverEl.classList.remove("hidden");

        gameOverSound.play();
        vibrate([100, 50, 100]);
    }

    locked = true;
    setTimeout(() => locked = false, 80);
}

// ==========================
// CONTROLS
// ==========================
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") play(moveLeft);
    if (e.key === "ArrowRight") play(moveRight);
    if (e.key === "ArrowUp") play(moveUp);
    if (e.key === "ArrowDown") play(moveDown);
});

// ==========================
// TOUCH CONTROLS
// ==========================
let startX = 0;
let startY = 0;

document.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold) play(moveRight);
        else if (dx < -threshold) play(moveLeft);
    } else {
        if (dy > threshold) play(moveDown);
        else if (dy < -threshold) play(moveUp);
    }
}, { passive: true });

// ==========================
// GAME OVER CHECK
// ==========================
function canMove() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) return true;
        }
    }

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r][c] === board[r][c + 1]) return true;
        }
    }

    for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 3; r++) {
            if (board[r][c] === board[r + 1][c]) return true;
        }
    }

    return false;
}

// ==========================
// SAVE / LOAD
// ==========================
function saveGame() {
    localStorage.setItem("board", JSON.stringify(board));
    localStorage.setItem("score", score);
    localStorage.setItem("bestScore", bestScore);
}

function loadGame() {
    const b = localStorage.getItem("board");
    const s = localStorage.getItem("score");
    const bs = localStorage.getItem("bestScore");

    if (bs) bestScore = Number(bs);

    if (b && s) {
        board = JSON.parse(b);
        score = Number(s);
        return true;
    }
    return false;
}

// ==========================
// RESTART
// ==========================
function restartGame() {
    score = 0;
    gameOverShown = false;

    init();
    addTile();
    addTile();

    gameOverEl?.classList.add("hidden");

    draw();
    saveGame();
}

// ==========================
// BUTTONS
// ==========================
newGameBtn?.addEventListener("click", () => {
    clickSound.play();
    vibrate(10);
    restartGame();
});

restartBtn?.addEventListener("click", restartGame);

// ==========================
// START GAME
// ==========================
if (!loadGame()) {
    init();
    addTile();
    addTile();
    saveGame();
}

draw();

// ==========================
// SERVICE WORKER
// ==========================
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("SW Registered"))
        .catch(err => console.log("SW Failed", err));
}

