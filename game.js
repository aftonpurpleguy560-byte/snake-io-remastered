const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const startBtn = document.getElementById('startBtn');
const boostBtn = document.getElementById('boost-btn');

let gameRunning = false;
let score = 0;
let foods = [];
let isBoosting = false;
let snake = { x: 0, y: 0, radius: 12, segments: [], length: 8, angle: 0, speed: 3.5, color: '#A020F0' };

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    snake.x = canvas.width / 2;
    snake.y = canvas.height / 2;
}

window.addEventListener('touchmove', (e) => {
    if(!gameRunning) return;
    const dx = e.touches[0].clientX - snake.x;
    const dy = e.touches[0].clientY - snake.y;
    snake.angle = Math.atan2(dy, dx);
}, { passive: false });

boostBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isBoosting = true; });
boostBtn.addEventListener('touchend', () => { isBoosting = false; });

function update() {
    if(!gameRunning) return;
    let currentSpeed = isBoosting ? snake.speed * 1.8 : snake.speed;
    snake.x += Math.cos(snake.angle) * currentSpeed;
    snake.y += Math.sin(snake.angle) * currentSpeed;

    snake.segments.unshift({x: snake.x, y: snake.y});
    if (snake.segments.length > snake.length * 4) snake.segments.pop();

    foods.forEach((food, i) => {
        if (Math.hypot(snake.x - food.x, snake.y - food.y) < snake.radius + food.radius) {
            foods.splice(i, 1);
            snake.length++;
            score += 10;
            scoreVal.innerText = score;
        }
    });
    if(foods.length < 30) foods.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: 5, color: 'lime'});
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    foods.forEach(f => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill(); });
    snake.segments.forEach((seg, i) => {
        if (i % 4 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI*2); ctx.fill();
        }
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

startBtn.onclick = () => {
    const name = document.getElementById('pName').value.trim();
    const finalName = name === "" ? "Guest" : name; // İsim boşsa Guest yap
    document.getElementById('menu').style.display = 'none';
    gameRunning = true;
};

init(); loop();

