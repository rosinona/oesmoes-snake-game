// Global variables
let canvas, ctx;
let scoreDisplay, highScoreDisplay, livesDisplay, levelDisplay;
let menu, gameContainer, pauseOverlay;
let restartBtn, pauseBtn, resumeBtn, menuBtn;

const gridSize = 20;
let tileCount = 25;

const difficultySettings = {
    easy: { speed: 120, multiplier: 1 },
    medium: { speed: 80, multiplier: 1.5 },
    hard: { speed: 40, multiplier: 2 }
};

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let powerups = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let lives = 3;
let level = 1;
let highScore = 0;
let gameRunning = false;
let gamePaused = false;
let currentDifficulty = 'medium';
let gameLoopInterval;

// Initialize everything when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, initializing game...');
    
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreDisplay = document.getElementById('score');
    highScoreDisplay = document.getElementById('highScore');
    livesDisplay = document.getElementById('lives');
    levelDisplay = document.getElementById('level');
    menu = document.getElementById('menu');
    gameContainer = document.getElementById('gameContainer');
    pauseOverlay = document.getElementById('pauseOverlay');
    restartBtn = document.getElementById('restartBtn');
    pauseBtn = document.getElementById('pauseBtn');
    resumeBtn = document.getElementById('resumeBtn');
    menuBtn = document.getElementById('menuBtn');
    
    tileCount = canvas.width / gridSize;
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    highScoreDisplay.textContent = highScore;
    
    // Add difficulty button listeners
    const diffBtns = document.querySelectorAll('.difficulty-btn');
    console.log('Found difficulty buttons:', diffBtns.length);
    
    diffBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const diff = this.getAttribute('data-difficulty');
            console.log('Clicked difficulty:', diff);
            currentDifficulty = diff;
            startGame();
        });
    });
    
    // Add game button listeners
    restartBtn.addEventListener('click', restartGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    menuBtn.addEventListener('click', goToMenu);
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeydown);
    
    console.log('Game initialized successfully');
});

function startGame() {
    console.log('Starting game...');
    snake = [{ x: 10, y: 10 }];
    food = { x: 15, y: 15 };
    powerups = [];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    lives = 3;
    level = 1;
    gameRunning = true;
    gamePaused = false;
    
    menu.style.display = 'none';
    gameContainer.style.display = 'flex';
    pauseOverlay.style.display = 'none';
    
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    levelDisplay.textContent = level;
    pauseBtn.textContent = 'Pause';
    
    clearInterval(gameLoopInterval);
    const speed = difficultySettings[currentDifficulty].speed;
    console.log('Game speed:', speed);
    gameLoopInterval = setInterval(gameLoop, speed);
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    update();
    draw();
}

function update() {
    if (!gameRunning || gamePaused) return;
    
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        lives--;
        livesDisplay.textContent = lives;
        if (lives <= 0) {
            endGame();
            return;
        }
        snake = [{ x: 10, y: 10 }];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        return;
    }
    
    // Self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            lives--;
            livesDisplay.textContent = lives;
            if (lives <= 0) {
                endGame();
                return;
            }
            snake = [{ x: 10, y: 10 }];
            direction = { x: 1, y: 0 };
            nextDirection = { x: 1, y: 0 };
            return;
        }
    }
    
    snake.unshift(head);
    
    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += Math.floor(10 * difficultySettings[currentDifficulty].multiplier);
        scoreDisplay.textContent = score;
        
        const newLevel = Math.floor(score / 200) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelDisplay.textContent = level;
        }
        
        generateFood();
        
        if (Math.random() < 0.3) {
            generatePowerup();
        }
    } else {
        snake.pop();
    }
    
    // Powerup collision
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        if (head.x === powerup.x && head.y === powerup.y) {
            activatePowerup(powerup.type);
            powerups.splice(i, 1);
        }
    }
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = '#00cc66';
            ctx.shadowColor = 'transparent';
        }
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });
    
    // Food
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Powerups
    powerups.forEach(powerup => {
        ctx.shadowColor = powerup.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = powerup.color;
        ctx.fillRect(
            powerup.x * gridSize + 4,
            powerup.y * gridSize + 4,
            gridSize - 8,
            gridSize - 8
        );
    });
    ctx.shadowColor = 'transparent';
    
    // Game over screen
    if (!gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('hoe dkkr ga je dood', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    }
}

function generateFood() {
    let valid = false;
    let newFood;
    
    while (!valid) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        valid = !snake.some(s => s.x === newFood.x && s.y === newFood.y) &&
                !powerups.some(p => p.x === newFood.x && p.y === newFood.y);
    }
    
    food = newFood;
}

function generatePowerup() {
    const types = [
        { type: 'gold', color: '#ffd700' },
        { type: 'shield', color: '#00aaff' }
    ];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    let valid = false;
    let newPowerup;
    
    while (!valid) {
        newPowerup = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: selectedType.type,
            color: selectedType.color
        };
        
        valid = !snake.some(s => s.x === newPowerup.x && s.y === newPowerup.y) &&
                !(food.x === newPowerup.x && food.y === newPowerup.y) &&
                !powerups.some(p => p.x === newPowerup.x && p.y === newPowerup.y);
    }
    
    powerups.push(newPowerup);
}

function activatePowerup(type) {
    if (type === 'gold') {
        score += 40;
        scoreDisplay.textContent = score;
    } else if (type === 'shield') {
        lives++;
        livesDisplay.textContent = lives;
    }
}

function endGame() {
    gameRunning = false;
    clearInterval(gameLoopInterval);
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

function restartGame() {
    startGame();
}

function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    pauseOverlay.style.display = gamePaused ? 'flex' : 'none';
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
}

function goToMenu() {
    clearInterval(gameLoopInterval);
    gameRunning = false;
    gamePaused = false;
    menu.style.display = 'flex';
    gameContainer.style.display = 'none';
    pauseOverlay.style.display = 'none';
}

function handleKeydown(e) {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowUp':
            if (direction.y === 0) nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (direction.y === 0) nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
            if (direction.x === 0) nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
            if (direction.x === 0) nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
        case ' ':
            togglePause();
            e.preventDefault();
            break;
    }
}
