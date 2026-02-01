/** * Purpleguy © 2026 - tablet power 
 * Stabil Oyun Motoru
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimap-canvas');
const mCtx = mCanvas.getContext('2d');

// Harita ve Oyun Değişkenleri
const WORLD_SIZE = 3000;
let gameRunning = false;
let score = 0;
let foods = [];
let bots = [];
let isBoosting = false;

// Oyuncu Yapısı
let snake = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    angle: 0,
    segments: [],
    length: 15,
    speed: 4,
    color: "#A020F0"
};

// Başlatma
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Yemekleri Oluştur
    for(let i=0; i<350; i++) spawnFood();
    
    // Botları Oluştur
    const names = ["Viper", "Neon", "Shadow", "Alpha", "Efe_King"];
    for(let i=0; i<12; i++) {
        bots.push({
            name: names[i % names.length] + "_" + (i+1),
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            angle: Math.random() * Math.PI * 2,
            segments: [],
            length: 20 + Math.random() * 30,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            score: Math.floor(Math.random() * 500)
        });
    }
}

function spawnFood() {
    foods.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        r: 4,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

// Kontroller (Joystick)
window.addEventListener('touchmove', (e) => {
    if(!gameRunning) return;
    const t = e.touches[0];
    const dx = t.clientX - 90; // Joystick merkez X
    const dy = t.clientY - (window.innerHeight - 90); // Joystick merkez Y
    snake.angle = Math.atan2(dy, dx);
    
    const dist = Math.min(Math.hypot(dx, dy), 30);
    document.getElementById('stick').style.transform = `translate(${Math.cos(snake.angle)*dist}px, ${Math.sin(snake.angle)*dist}px)`;
});

document.getElementById('boost').addEventListener('touchstart', () => isBoosting = true);
document.getElementById('boost').addEventListener('touchend', () => isBoosting = false);

// Oyun Döngüsü
function update() {
    if(!gameRunning) return;

    // Hareket ve Boost
    let currentSpeed = (isBoosting && snake.length > 10) ? 8 : 4;
    if(isBoosting && snake.length > 10) {
        snake.length -= 0.05;
        score = Math.max(0, score - 0.1);
    }

    snake.x += Math.cos(snake.angle) * currentSpeed;
    snake.y += Math.sin(snake.angle) * currentSpeed;

    // Segment Takibi
    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length) snake.segments.pop();

    // Sınır Kontrolü
    if(snake.x < 0 || snake.x > WORLD_SIZE || snake.y < 0 || snake.y > WORLD_SIZE) die();

    // Yemek Yeme
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < 20) {
            snake.length += 1;
            score += 10;
            foods.splice(i, 1);
            spawnFood();
        }
    });

    // Bot Hareketi ve Basit Çarpışma
    bots.forEach(b => {
        b.x += Math.cos(b.angle) * 3;
        b.y += Math.sin(b.angle) * 3;
        b.segments.unshift({x: b.x, y: b.y});
        if(b.segments.length > b.length) b.segments.pop();
        
        if(b.x < 0 || b.x > WORLD_SIZE || b.y < 0 || b.y > WORLD_SIZE) b.angle += Math.PI;
        if(Math.hypot(snake.x - b.x, snake.y - b.y) < 15) die();
    });

    updateUI();
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Kamera Takibi
    ctx.translate(canvas.width/2 - snake.x, canvas.height/2 - snake.y);

    // Grid (Izgara)
    ctx.strokeStyle = '#111';
    for(let i=0; i<=WORLD_SIZE; i+=150) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i); ctx.stroke();
    }

    // Yemekler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fill();
    });

    // Botlar
    bots.forEach(b => {
        ctx.fillStyle = b.color;
        b.segments.forEach(seg => {
            ctx.beginPath(); ctx.arc(seg.x, seg.y, 12, 0, Math.PI*2); ctx.fill();
        });
    });

    // Oyuncu
    snake.segments.forEach((seg, i) => {
        ctx.fillStyle = (i === 0) ? "white" : snake.color;
        ctx.beginPath(); ctx.arc(seg.x, seg.y, 14, 0, Math.PI*2); ctx.fill();
    });

    ctx.restore();
    drawMinimap();
}

function drawMinimap() {
    mCtx.clearRect(0,0,120,120);
    mCtx.fillStyle = "red";
    mCtx.beginPath();
    mCtx.arc((snake.x/WORLD_SIZE)*120, (snake.y/WORLD_SIZE)*120, 3, 0, Math.PI*2);
    mCtx.fill();
}

function updateUI() {
    document.getElementById('currentScore').innerText = Math.floor(score);
    // Basit Leaderboard
    let sorted = [...bots, {name: "Sen", score: Math.floor(score)}].sort((a,b) => b.score - a.score).slice(0,5);
    document.getElementById('leader-list').innerHTML = sorted.map(i => `<div class="leader-item"><span>${i.name}</span><span>${i.score}</span></div>`).join('');
}

function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    gameRunning = true;
    init();
}

function die() {
    gameRunning = false;
    document.getElementById('finalScoreDisplay').innerText = "Skorun: " + Math.floor(score);
    document.getElementById('deathMenu').style.display = 'flex';
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();

