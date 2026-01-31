const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const boostBtn = document.getElementById('boost-btn');

let gameRunning = false;
let score = 0;
let foods = [];
let isBoosting = false;

let snake = {
    x: 0, y: 0,
    radius: 12,
    segments: [],
    length: 8,
    angle: 0,
    speed: 3.5,
    color: '#A020F0'
};

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    snake.x = canvas.width / 2;
    snake.y = canvas.height / 2;
}

// Kontroller
window.addEventListener('touchmove', (e) => {
    if(!gameRunning) return;
    const touch = e.touches[0];
    const dx = touch.clientX - snake.x;
    const dy = touch.clientY - snake.y;
    snake.angle = Math.atan2(dy, dx);
}, { passive: false });

boostBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isBoosting = true; });
boostBtn.addEventListener('touchend', () => { isBoosting = false; });

function createFood() {
    if (foods.length < 40) {
        foods.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 5,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

function update() {
    if(!gameRunning) return;

    let currentSpeed = isBoosting ? snake.speed * 1.8 : snake.speed;
    
    snake.x += Math.cos(snake.angle) * currentSpeed;
    snake.y += Math.sin(snake.angle) * currentSpeed;

    // Vücut Takibi
    snake.segments.unshift({x: snake.x, y: snake.y});
    if (snake.segments.length > snake.length * 4) {
        snake.segments.pop();
    }

    // Yemek Yeme
    foods.forEach((food, i) => {
        const dist = Math.hypot(snake.x - food.x, snake.y - food.y);
        if (dist < snake.radius + food.radius) {
            foods.splice(i, 1);
            snake.length += 1;
            score += 10;
            scoreVal.innerText = score;
        }
    });

    // Kenar Kontrolü
    if (snake.x > canvas.width) snake.x = 0;
    if (snake.x < 0) snake.x = canvas.width;
    if (snake.y > canvas.height) snake.y = 0;
    if (snake.y < 0) snake.y = canvas.height;

    createFood();
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yemekler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Yılan
    snake.segments.forEach((seg, i) => {
        if (i % 4 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if(i === 0) { // Kafa/Göz
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

startBtn.onclick = () => {
    menu.style.display = 'none';
    gameRunning = true;
};

init();
loop();
