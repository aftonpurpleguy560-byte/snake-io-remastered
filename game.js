const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimap');
const mCtx = mCanvas.getContext('2d');
const lbContent = document.getElementById('lb-content');

let gameRunning = false;
let score = 0;
let foods = [];
let players = []; // Çok oyunculu simülasyonu için
let isBoosting = false;
let playerName = "Guest";

let snake = {
    x: 0, y: 0,
    radius: 14,
    segments: [],
    length: 12,
    angle: 0,
    speed: 3.2,
    color: '#A020F0'
};

// --- INITIALIZE ---
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    mCanvas.width = 150;
    mCanvas.height = 150;
    snake.x = Math.random() * canvas.width;
    snake.y = Math.random() * canvas.height;
    
    // Test amaçlı 3 rakip bot ekleyelim (Multiplayer mantığı)
    for(let i=0; i<3; i++) {
        players.push({
            name: "Bot_" + i,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            score: Math.floor(Math.random() * 500),
            color: 'gray'
        });
    }
}

// --- CONTROLS ---
const joyWrapper = document.getElementById('joystick-wrapper');
const stick = document.getElementById('joystick-stick');

joyWrapper.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joyWrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    snake.angle = Math.atan2(dy, dx);
    const dist = Math.min(rect.width / 2, Math.hypot(dx, dy));
    stick.style.transform = `translate(${Math.cos(snake.angle) * dist}px, ${Math.sin(snake.angle) * dist}px)`;
}, { passive: false });

document.getElementById('boost-btn').ontouchstart = (e) => { e.preventDefault(); isBoosting = true; };
document.getElementById('boost-btn').ontouchend = () => { isBoosting = false; };

// --- CORE LOGIC ---
function update() {
    if(!gameRunning) return;

    let currentSpeed = snake.speed;
    if(isBoosting && score > 10) {
        currentSpeed *= 2;
        score -= 0.1; // Boost bedeli
        snake.length -= 0.01;
        // Ganimet bırakma (Hızlanırken arkada küçük parçalar bırakır)
        if(Math.random() > 0.9) foods.push({x: snake.x, y: snake.y, radius: 3, color: snake.color});
    }

    snake.x += Math.cos(snake.angle) * currentSpeed;
    snake.y += Math.sin(snake.angle) * currentSpeed;

    // Vücut takibi
    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    // Ölüm Kontrolü (Kendi vücuduna çarpma)
    for(let i = 20; i < snake.segments.length; i++) {
        if(Math.hypot(snake.x - snake.segments[i].x, snake.y - snake.segments[i].y) < snake.radius) {
            gameOver();
        }
    }

    // Yemek yeme
    foods.forEach((food, i) => {
        if(Math.hypot(snake.x - food.x, snake.y - food.y) < snake.radius + food.radius) {
            foods.splice(i, 1);
            score += food.radius > 5 ? 20 : 10;
            snake.length += 1;
        }
    });

    if(foods.length < 60) foods.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: 5, color: `hsl(${Math.random()*360}, 100%, 50%)`});

    updateLeaderboard();
}

function updateLeaderboard() {
    let list = [...players, {name: playerName, score: Math.floor(score)}];
    list.sort((a, b) => b.score - a.score);
    lbContent.innerHTML = list.slice(0, 5).map(p => `
        <div class="lb-item">
            <span class="lb-name">${p.name}</span>
            <span class="lb-score">${Math.floor(p.score)}</span>
        </div>
    `).join('');
    document.getElementById('scoreVal').innerText = Math.floor(score);
}

function gameOver() {
    // Ölünce enkaz bırak
    snake.segments.forEach(seg => {
        if(Math.random() > 0.5) foods.push({x: seg.x, y: seg.y, radius: 7, color: 'white'});
    });
    alert("Öldün Efe! Skorun: " + Math.floor(score));
    location.reload();
}

// --- DRAWING ---
function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (Arka plan dokusu)
    ctx.strokeStyle = '#111';
    for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
    for(let j=0; j<canvas.height; j+=50) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(canvas.width,j); ctx.stroke(); }

    // Yemekler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
    });

    // Yılan
    snake.segments.forEach((seg, i) => {
        if(i % 3 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius - (i*0.05), 0, Math.PI*2); ctx.fill();
            if(i === 0) { // Gözler
                ctx.fillStyle = "white";
                ctx.beginPath(); ctx.arc(seg.x+5, seg.y-5, 5, 0, Math.PI*2); ctx.arc(seg.x+5, seg.y+5, 5, 0, Math.PI*2); ctx.fill();
            }
        }
    });

    drawMinimap();
}

function drawMinimap() {
    mCtx.fillStyle = 'rgba(0,0,0,0.8)';
    mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
    // Kendi konumun (Mor nokta)
    mCtx.fillStyle = '#A020F0';
    mCtx.beginPath(); mCtx.arc((snake.x/canvas.width)*150, (snake.y/canvas.height)*150, 3, 0, Math.PI*2); mCtx.fill();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.setSkin = (color, el) => {
    snake.color = color;
    document.querySelectorAll('.skin').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
};

document.getElementById('startBtn').onclick = () => {
    playerName = document.getElementById('pName').value || "Guest";
    document.getElementById('menu').style.display = 'none';
    gameRunning = true;
};

init(); loop();
