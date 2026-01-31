const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimap');
const mCtx = mCanvas.getContext('2d');
const lbContent = document.getElementById('lb-content');
const menu = document.getElementById('menu');

let gameRunning = false;
let score = 0;
let foods = [];
let isBoosting = false;
let playerName = "Guest";

let snake = { x: 0, y: 0, radius: 14, segments: [], length: 12, angle: 0, speed: 3.2, color: '#A020F0' };

// BOTLAR VE İSİMLERİ
let bots = [
    { name: "Pro_Slayer", x: 200, y: 300, score: 500, color: 'red', angle: Math.random() * 6 },
    { name: "Snake_Master", x: 800, y: 150, score: 350, color: 'orange', angle: Math.random() * 6 },
    { name: "Ghost_Killer", x: 400, y: 700, score: 200, color: 'blue', angle: Math.random() * 6 }
];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    snake.x = canvas.width / 2;
    snake.y = canvas.height / 2;
    score = 0;
    snake.length = 12;
    snake.segments = [];
    foods = [];
    // Yemekleri başlangıçta dağıt
    for(let i=0; i<50; i++) spawnFood();
}

function spawnFood() {
    foods.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: 5, color: 'white' });
}

// JOYSTICK KONTROLÜ
const joyWrapper = document.getElementById('joystick-wrapper');
const stick = document.getElementById('joystick-stick');

joyWrapper.addEventListener('touchmove', (e) => {
    if(!gameRunning) return;
    const touch = e.touches[0];
    const rect = joyWrapper.getBoundingClientRect();
    const dx = touch.clientX - (rect.left + rect.width / 2);
    const dy = touch.clientY - (rect.top + rect.height / 2);
    snake.angle = Math.atan2(dy, dx);
    const dist = Math.min(rect.width / 2, Math.hypot(dx, dy));
    stick.style.transform = `translate(${Math.cos(snake.angle)*dist}px, ${Math.sin(snake.angle)*dist}px)`;
}, { passive: false });

document.getElementById('boost-btn').ontouchstart = (e) => { e.preventDefault(); isBoosting = true; };
document.getElementById('boost-btn').ontouchend = () => { isBoosting = false; };

function update() {
    if(!gameRunning) return;

    let speed = isBoosting && score > 5 ? snake.speed * 2 : snake.speed;
    if(isBoosting && score > 5) {
        score -= 0.05;
        snake.length -= 0.005;
    }

    snake.x += Math.cos(snake.angle) * speed;
    snake.y += Math.sin(snake.angle) * speed;
    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    // DUVARLARA ÇARPMA KONTROLÜ
    if(snake.x < 0 || snake.x > canvas.width || snake.y < 0 || snake.y > canvas.height) gameOver();

    // YEMEK YEME
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < snake.radius + f.radius) {
            foods.splice(i, 1);
            score += 10;
            snake.length += 1;
            spawnFood();
        }
    });

    // BOT HAREKETLERİ (Basit)
    bots.forEach(b => {
        b.x += Math.cos(b.angle) * 2;
        b.y += Math.sin(b.angle) * 2;
        if(b.x < 0 || b.x > canvas.width) b.angle = Math.PI - b.angle;
        if(b.y < 0 || b.y > canvas.height) b.angle = -b.angle;
    });

    updateLeaderboard();
}

function updateLeaderboard() {
    let list = [...bots, {name: playerName, score: Math.floor(score)}].sort((a,b) => b.score - a.score);
    if(lbContent) lbContent.innerHTML = list.map(p => `<div class="lb-item"><span>${p.name}</span><b>${Math.floor(p.score)}</b></div>`).join('');
    document.getElementById('scoreVal').innerText = Math.floor(score);
}

function gameOver() {
    gameRunning = false;
    menu.style.display = 'flex'; // Alert yerine menüye dön
    init();
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yemekler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
    });

    // Yılan
    snake.segments.forEach((seg, i) => {
        if(i % 3 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI*2); ctx.fill();
            if(i === 0) { // Gözler
                ctx.fillStyle = "white";
                ctx.beginPath(); ctx.arc(seg.x+6, seg.y-6, 5, 0, Math.PI*2); ctx.arc(seg.x+6, seg.y+6, 5, 0, Math.PI*2); ctx.fill();
            }
        }
    });

    drawMinimap();
}

function drawMinimap() {
    if(!mCtx) return;
    mCtx.clearRect(0,0,150,150);
    // Sen (Mor)
    mCtx.fillStyle = '#A020F0';
    mCtx.beginPath(); mCtx.arc((snake.x/canvas.width)*150, (snake.y/canvas.height)*150, 4, 0, Math.PI*2); mCtx.fill();
    // Botlar (Kırmızı)
    mCtx.fillStyle = 'red';
    bots.forEach(b => {
        mCtx.beginPath(); mCtx.arc((b.x/canvas.width)*150, (b.y/canvas.height)*150, 3, 0, Math.PI*2); mCtx.fill();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

document.getElementById('startBtn').onclick = () => {
    playerName = document.getElementById('pName').value || "Guest";
    menu.style.display = 'none';
    gameRunning = true;
};

init(); loop();

