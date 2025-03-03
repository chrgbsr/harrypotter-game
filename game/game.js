const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const scoreDisplay = document.getElementById('score');

// Game Setup
canvas.width = 800;
canvas.height = 400;
let gameState = 'LOADING';
let score = 0;
let frameCount = 0;

// Game Settings
const GRAVITY = 0.3;
const JUMP_FORCE = -5;
const CASTLE_SPEED = 2.5;
const GAP_HEIGHT = 160;
const CASTLE_WIDTH = 60;
const CASTLE_SPACING = 300;
const SNITCH_SPAWN_RATE = 0.02;

// Game Entities
const harry = {
    x: 100,
    y: canvas.height/2,
    width: 40,
    height: 40,
    velocity: 0,
    rotation: 0
};

const castles = [];
const snitches = [];
let hermione = null;

// Assets
const assets = {
    background: new Image(),
    harry: new Image(),
    castle: new Image(),
    snitch: new Image(),
    hermione: new Image()
};

// Sound Effects
const sounds = {
    background: new Audio('sounds/background.mp3'),
    point: new Audio('sounds/point.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    win: new Audio('sounds/win.mp3')
};

// Load Assets
assets.background.src = 'assets/background.jpg';
assets.harry.src = 'assets/harry.png';
assets.castle.src = 'assets/castle.png';
assets.snitch.src = 'assets/snitch.png';
assets.hermione.src = 'assets/hermione.png';

// Configure Sounds
sounds.background.loop = true;
sounds.background.volume = 0.5;
sounds.point.volume = 0.7;
sounds.lose.volume = 0.7;
sounds.win.volume = 0.7;

// Input Handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if(gameState === 'PLAYING') {
            harry.velocity = JUMP_FORCE;
            harry.rotation = -30;
        } else if(gameState === 'GAME_OVER' || gameState === 'WIN') {
            resetGame();
        }
    }
});

function createCastle() {
    const minY = 80;
    const maxY = canvas.height - minY - GAP_HEIGHT;
    const gapY = minY + Math.random() * (maxY - minY);
    
    // Top castle (upside down)
    castles.push({
        x: canvas.width,
        y: 0,
        width: CASTLE_WIDTH,
        height: gapY,
        flipped: true
    });
    
    // Bottom castle
    castles.push({
        x: canvas.width,
        y: gapY + GAP_HEIGHT,
        width: CASTLE_WIDTH,
        height: canvas.height - (gapY + GAP_HEIGHT),
        flipped: false
    });
}

function createSnitch() {
    snitches.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 30),
        width: 20,
        height: 20
    });
}

function spawnHermione() {
    hermione = {
        x: canvas.width,
        y: canvas.height/2 - 50,
        width: 40,
        height: 60
    };
}

function drawCastle(castle) {
    ctx.save();
    if(castle.flipped) {
        ctx.translate(castle.x + CASTLE_WIDTH/2, castle.height);
        ctx.scale(1, -1);
        ctx.drawImage(
            assets.castle,
            -CASTLE_WIDTH/2,
            0,
            castle.width,
            castle.height
        );
    } else {
        ctx.drawImage(
            assets.castle,
            castle.x,
            castle.y,
            castle.width,
            castle.height
        );
    }
    ctx.restore();
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function update() {
    if(gameState !== 'PLAYING') return;

    // Harry Physics
    harry.velocity += GRAVITY;
    harry.y += harry.velocity;
    harry.rotation = Math.min(harry.rotation + 1, 90);

    // Generate Elements
    if(frameCount % CASTLE_SPACING === 0) createCastle();
    if(Math.random() < SNITCH_SPAWN_RATE) createSnitch();
    if(score >= 100 && !hermione) spawnHermione();

    // Update Positions
    castles.forEach(castle => castle.x -= CASTLE_SPEED);
    snitches.forEach(snitch => snitch.x -= CASTLE_SPEED * 0.8);
    if(hermione) hermione.x -= CASTLE_SPEED * 0.5;

    // Collision Detection
    castles.forEach(castle => {
        if(checkCollision(harry, castle)) {
            sounds.lose.play();
            gameOver();
        }
    });

    // Collect Snitches
    snitches.forEach((snitch, index) => {
        if(checkCollision(harry, snitch)) {
            snitches.splice(index, 1);
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            sounds.point.play();
        }
    });

    // Reach Hermione
    if(hermione && checkCollision(harry, hermione)) {
        sounds.win.play();
        gameState = 'WIN';
    }

    // Screen Boundaries
    if(harry.y < 0 || harry.y + harry.height > canvas.height) {
        sounds.lose.play();
        gameOver();
    }

    frameCount++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background
    ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    
    // Draw Castles
    castles.forEach(castle => drawCastle(castle));

    // Draw Snitches
    snitches.forEach(snitch => {
        ctx.drawImage(assets.snitch, snitch.x, snitch.y, snitch.width, snitch.height);
    });

    // Draw Hermione
    if(hermione) {
        ctx.drawImage(assets.hermione, hermione.x, hermione.y, hermione.width, hermione.height);
    }

    // Draw Harry
    ctx.save();
    ctx.translate(harry.x + harry.width/2, harry.y + harry.height/2);
    ctx.rotate(harry.rotation * Math.PI/180);
    ctx.drawImage(assets.harry, -harry.width/2, -harry.height/2, harry.width, harry.height);
    ctx.restore();

    // Game States
    if(gameState === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 20);
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Press Space to Restart', canvas.width/2, canvas.height/2 + 60);
    }
    
    if(gameState === 'WIN') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Found Hermione!', canvas.width/2, canvas.height/2 - 20);
        ctx.fillText('Press Space to Play Again', canvas.width/2, canvas.height/2 + 20);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAME_OVER';
    sounds.background.pause();
}

function resetGame() {
    harry.y = canvas.height/2;
    harry.velocity = 0;
    harry.rotation = 0;
    castles.length = 0;
    snitches.length = 0;
    hermione = null;
    score = 0;
    frameCount = 0;
    gameState = 'PLAYING';
    scoreDisplay.textContent = `Score: ${score}`;
    sounds.background.currentTime = 0;
    sounds.background.play();
}

// Start Game
let loadedAssets = 0;
Object.values(assets).forEach(img => {
    img.onload = () => {
        loadedAssets++;
        if(loadedAssets === Object.keys(assets).length) {
            loading.style.display = 'none';
            gameState = 'PLAYING';
            sounds.background.play();
            gameLoop();
        }
    };
});