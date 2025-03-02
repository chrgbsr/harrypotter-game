// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

// Load assets
const harry = {
    x: 50,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.3,
    lift: -6,
    img: new Image()
};
harry.img.src = "harry.png";

const castleImg = new Image();
castleImg.src = "castle.png";

const cloudImg = new Image();
cloudImg.src = "cloud.png";

const snitchImg = new Image();
snitchImg.src = "snitch.png";

// Audio setup
const bgMusic = new Audio("background.mp3");
const beepSound = new Audio("beep.mp3"); // Beep when hitting obstacles
const pointSound = new Audio("point.mp3"); // Sound when collecting Snitch
bgMusic.loop = true;
bgMusic.volume = 0.5;
beepSound.volume = 1.0;
pointSound.volume = 1.0;

// Play music on user interaction
function startMusic() {
    bgMusic.play().catch(error => console.log("Autoplay blocked:", error));
}
document.addEventListener("click", startMusic);
document.addEventListener("keydown", startMusic);

// Variables
let obstacles = [];
let clouds = [];
let snitch = { x: canvas.width / 2, y: canvas.height / 2, width: 30, height: 30, speed: 2 };
let score = 0;
let coins = 0;
let gameRunning = true;

// Generate clouds
function createCloud() {
    clouds.push({
        x: canvas.width + Math.random() * 200,
        y: Math.random() * (canvas.height - 100),
        speed: Math.random() * 2 + 1
    });
}

// Draw clouds
function drawClouds() {
    clouds.forEach(cloud => {
        ctx.drawImage(cloudImg, cloud.x, cloud.y, 80, 50);
    });
}

// Update cloud positions
function updateClouds() {
    clouds.forEach((cloud, index) => {
        cloud.x -= cloud.speed;
        if (cloud.x + 80 < 0) clouds.splice(index, 1);
    });
}

// Draw Harry
function drawHarry() {
    ctx.drawImage(harry.img, harry.x, harry.y, harry.width, harry.height);
}

// Update Harry's movement
function updateHarry() {
    harry.velocity += harry.gravity;
    harry.y += harry.velocity;

    if (harry.y + harry.height > canvas.height || harry.y < 0) {
        gameOver();
    }
}

// Generate obstacles (towers)
function createObstacle() {
    let minHeight = 80;
    let maxHeight = canvas.height - 200 - minHeight;
    let height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    obstacles.push({
        x: canvas.width,
        topHeight: height,
        bottomY: height + 200,
        width: 80,
        passed: false
    });
}

// Draw obstacles (towers)
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(castleImg, obstacle.x, obstacle.bottomY, obstacle.width, canvas.height - obstacle.bottomY);
        
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width, obstacle.topHeight);
        ctx.scale(-1, -1);
        ctx.drawImage(castleImg, 0, 0, obstacle.width, obstacle.topHeight);
        ctx.restore();
    });
}

// Update obstacles and detect collisions
function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= 3;
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score++; // Score only increases when passing obstacles
        }

        if (
            harry.x < obstacle.x + obstacle.width &&
            harry.x + harry.width > obstacle.x &&
            (harry.y < obstacle.topHeight || harry.y + harry.height > obstacle.bottomY)
        ) {
            gameOver();
        }
    });
}

// Draw snitch
function drawSnitch() {
    ctx.drawImage(snitchImg, snitch.x, snitch.y, snitch.width, snitch.height);
}

// Update snitch movement (moves toward Harry)
function updateSnitch() {
    let dx = harry.x - snitch.x;
    let dy = harry.y - snitch.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) { // Move toward Harry if not too close
        snitch.x += (dx / distance) * snitch.speed;
        snitch.y += (dy / distance) * snitch.speed;
    } else {
        pointSound.play(); // Play point sound when caught
        coins += 1; // Increase coin count
        snitch.x = canvas.width + Math.random() * 100;
        snitch.y = Math.random() * (canvas.height - 50);
    }
}

// Handle game over
function gameOver() {
    gameRunning = false;
}

// Restart game when pressing Space key
function restartGame() {
    score = 0;
    coins = 0;
    harry.y = canvas.height / 2;
    harry.velocity = 0;
    obstacles = [];
    snitch.x = canvas.width / 2;
    snitch.y = canvas.height / 2;
    gameRunning = true;
    gameLoop();
}

// Draw score & coins
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("Coins: " + coins, canvas.width - 120, 30); // Display coins on right side
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawClouds();
    drawHarry();
    drawObstacles();
    drawSnitch();
    drawScore();
    updateHarry();
    updateObstacles();
    updateSnitch();
    updateClouds();
    requestAnimationFrame(gameLoop);
}

// Control Harry & Restart Game
document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        if (!gameRunning) {
            restartGame();
        } else {
            harry.velocity = harry.lift;
        }
    }
});

// Generate obstacles, clouds, and snitch movement
setInterval(createObstacle, 2500);
setInterval(createCloud, 3000);
gameLoop();
