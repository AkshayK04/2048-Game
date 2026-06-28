const moveSound = new Audio("sounds/swipe.mp3");
const mergeSound = new Audio("sounds/transition.mp3");
const gameOverSound = new Audio("sounds/pop.mp3");
const clickSound = new Audio("sounds/click.mp3");


// create sound
function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}


// create vibration
function vibrate(pattern) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}



const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");

const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

let gameOverShown = false;
let board = [];
let score = 0;
let bestScore = 0;
let locked = false;

// Used for spawn animation
let prevBoard = [];

/* ==========================
   INIT
========================== */

function init() {
    board = Array.from({ length: 4 }, () => Array(4).fill(0));
    prevBoard = Array.from({ length: 4 }, () => Array(4).fill(0));
}

/* ==========================
   ADD RANDOM TILE
========================== */

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


/* ==========================
   PARTICLE ANIMATION
========================== */

function createParticles(x, y) {

    for (let i = 0; i < 24; i++) {

        const p = document.createElement("div");

        p.className = "particle";

        p.style.left = x + "px";
        p.style.top = y + "px";

        // Random rainbow color
        const color = getParticleColor();

        p.style.background = color;
        p.style.boxShadow = `0 0 8px ${color}`;

        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 80;

        p.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        p.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

        document.body.appendChild(p);

        p.addEventListener("animationend", () => {
            p.remove();
        });
    }
}

/* ==========================
   RANDOM PARTICLE COLOR
========================== */

function getParticleColor() {
        return "rgba(255,255,255,0.9)";

}


/* ==========================
   COMPRESS + MERGE
========================== */

function compress(row) {

    // remove zeros first
    let arr = row.filter(v => v !== 0);

    let merged = [false, false, false, false];

    // merge step
    for (let i = 0; i < arr.length - 1; i++) {

        if (
            arr[i] === arr[i + 1] &&
            !merged[i] &&
            !merged[i + 1]
        ) {
            arr[i] *= 2;
            score += arr[i];

            playSound(mergeSound);
            vibrate([30, 50, 30]); // strong "double tap" feel

            const rect = boardEl.getBoundingClientRect();

            createParticles(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2);



            arr[i + 1] = 0;

            merged[i] = true;
        }
    }

    // remove zeros again after merge
    arr = arr.filter(v => v !== 0);

    // fill remaining spaces with 0
    while (arr.length < 4) {
        arr.push(0);
    }

    return arr;
}

/* ==========================
   MOVE LEFT
========================== */

function moveLeft() {

    for (let r = 0; r < 4; r++) {
        board[r] = compress(board[r]);
    }

}

/* ==========================
   MOVE RIGHT
========================== */

function moveRight() {

    for (let r = 0; r < 4; r++) {

        let reversed = [...board[r]].reverse();

        board[r] = compress(reversed).reverse();

    }

}

/* ==========================
   MOVE UP
========================== */

function moveUp() {

    for (let c = 0; c < 4; c++) {

        let column = [];

        for (let r = 0; r < 4; r++) {
            column.push(board[r][c]);
        }

        column = compress(column);

        for (let r = 0; r < 4; r++) {
            board[r][c] = column[r];
        }

    }

}

/* ==========================
   MOVE DOWN
========================== */

function moveDown() {

    for (let c = 0; c < 4; c++) {

        let column = [];

        for (let r = 0; r < 4; r++) {
            column.push(board[r][c]);
        }

        column = compress([...column].reverse()).reverse();

        for (let r = 0; r < 4; r++) {
            board[r][c] = column[r];
        }

    }

}

/* ==========================
   DRAW BOARD
========================== */

function draw() {

    boardEl.innerHTML = "";

    for (let r = 0; r < 4; r++) {

        for (let c = 0; c < 4; c++) {

            const tile = document.createElement("div");

            tile.className = "tile";

            const value = board[r][c];

            if (value !== 0) {

                tile.textContent = value;

                // Used by CSS tile colors
                tile.dataset.value = value;

            }

// win condition

            if (value === 2048 && !gameOverShown) {

                setTimeout(() => {

                    gameOverShown = true;

                    finalScoreEl.textContent = score;

                    gameOverEl.classList.remove("hidden");

                    gameOverEl.querySelector("h2").textContent = "You Win! 🎉";

                }, 200);
            }



            // Spawn animation
            if (
                value !== 0 &&
                (!prevBoard[r] || prevBoard[r][c] === 0)
            ) {
                tile.classList.add("spawn");
            }

            tile.addEventListener("click", () => {

                tile.classList.add("clicked");

                setTimeout(() => {
                    tile.classList.remove("clicked");
                }, 120);

            });

            boardEl.appendChild(tile);

        }

    }

    prevBoard = board.map(row => [...row]);

    scoreEl.textContent = score;

    if (score > bestScore) {
        bestScore = score;
    }

    bestScoreEl.textContent = bestScore;

}


/* ==========================
   PLAY
========================== */

function play(move) {

    if (locked) return;

    const oldBoard = JSON.stringify(board);

    move();

    // ❌ If nothing changed, stop here
    if (oldBoard === JSON.stringify(board)) {
        return;
    }

    // ✅ valid move → add tile

    playSound(moveSound); // 👈 ADD HERE
    vibrate(20); // light tap feedback


    addTile();

    boardEl.classList.add("move");

    setTimeout(() => {
        boardEl.classList.remove("move");
    }, 120);

    draw();

    saveGame();

    // 🧠 Game Over check (safe version)
    setTimeout(() => {

        if (!canMove() && !gameOverShown) {

            gameOverShown = true;

            finalScoreEl.textContent = score;

            gameOverEl.classList.remove("hidden");

            gameOverSound.play(); // 👈 HERE
            vibrate([100, 50, 100]);

        }

    }, 200);

    locked = true;

    setTimeout(() => {
        locked = false;
    }, 80);
}


/* ==========================
   restart game
========================== */


function restartGame() {

    // reset score
    score = 0;
    locked = false;

    gameOverShown = false;


    // reset board
    init();

    // add starting tiles
    addTile();
    addTile();

    // hide game over screen (if you added it)
    if (gameOverEl) {
        gameOverEl.classList.add("hidden");
    }

    // update UI
    draw();

    // save reset state (localStorage support)
    saveGame();
}


//button click
if (restartBtn) {
    restartBtn.addEventListener("click", restartGame);
}


/* ==========================
   KEYBOARD CONTROLS
========================== */

document.addEventListener("keydown", (e) => {

    switch (e.key) {

        case "ArrowLeft":
            e.preventDefault();
            play(moveLeft);
            break;

        case "ArrowRight":
            e.preventDefault();
            play(moveRight);
            break;

        case "ArrowUp":
            e.preventDefault();
            play(moveUp);
            break;

        case "ArrowDown":
            e.preventDefault();
            play(moveDown);
            break;

    }

});

/* ==========================
   MOBILE SWIPE
========================== */

let startX = 0;
let startY = 0;

document.addEventListener("touchstart", (e) => {

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;

}, { passive: true });

document.addEventListener("touchend", (e) => {

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const dx = endX - startX;
    const dy = endY - startY;

    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {

        if (dx > threshold) {
            play(moveRight);
        } else if (dx < -threshold) {
            play(moveLeft);
        }

    } else {

        if (dy > threshold) {
            play(moveDown);
        } else if (dy < -threshold) {
            play(moveUp);
        }

    }

}, { passive: true });


/* ==========================
   CAN MOVE?
========================== */

function canMove() {

    // Empty cell exists
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) {
                return true;
            }
        }
    }

    // Horizontal merge possible
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r][c] === board[r][c + 1]) {
                return true;
            }
        }
    }

    // Vertical merge possible
    for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 3; r++) {
            if (board[r][c] === board[r + 1][c]) {
                return true;
            }
        }
    }

    return false;
}


// add button click sound
document.getElementById("newGameBtn").addEventListener("click", () => {
    clickSound.play();
    restartGame();
});


// add button vibration sound

document.getElementById("newGameBtn").addEventListener("click", () => {
    vibrate(10);
    clickSound.play();
    restartGame();
});


/* ==========================
   NEW GAME
========================== */

document.getElementById("newGameBtn").addEventListener("click", restartGame);


/* ==========================
   SAVE GAME
========================== */

function saveGame() {

    localStorage.setItem("board", JSON.stringify(board));
    localStorage.setItem("score", score);
    localStorage.setItem("bestScore", bestScore);


}

/* ==========================
   LOAD GAME
========================== */

function loadGame() {

    const savedBoard = localStorage.getItem("board");
    const savedScore = localStorage.getItem("score");
    const savedBest = localStorage.getItem("bestScore");


    if (savedBest !== null) {
        bestScore = Number(savedBest);
    }

    if (savedBoard && savedScore !== null) {

        board = JSON.parse(savedBoard);
        score = Number(savedScore);

        return true;
    }

    return false;

}

/* ==========================
   START GAME
========================== */

if (!loadGame()) {

    init();

    addTile();
    addTile();

    saveGame();

}

draw();


// service worker for offline
self.addEventListener("install", () => {
    console.log("App installed");
});


    // your game code...

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
    .then(() => console.log("Service Worker Registered"));
}