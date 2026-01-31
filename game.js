const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimap');
const mCtx = mCanvas.getContext('2d');
const menu = document.getElementById('menu');
const goScreen = document.getElementById('gameOverScreen');

let gameRunning = false;
let score = 0;
let foods = [];
let isBoosting = false;
let playerName = "Guest";

let snake = { x: 0, y: 0, radius: 14, segments: [], length: 12, angle: 0, speed: 3.5, color: '#A020F0' };

// ULTRA ZEKİ BOTLAR
let bots = [];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    snake.x = canvas.width / 2;
    snake.y = canvas.height / 2;
    snake.segments = [];
    snake.length = 12;
    score = 0;
    foods = [];

    // Botları Farklı Bölgelerde Başlat
    bots = [
        { name: "Alpha_Predator", x: 100, y: 100, score: 600, color: '#FF0000', angle: 0, segments: [], length: 15 },
        { name: "Shadow_Snake", x: canvas.width - 100, y: 100, score: 400, color: '#00FF00', angle: 0, segments: [], length: 12 },
        { name: "Neon_Hunter", x: 100, y: canvas.height - 100, score: 250, color: '#00CCFF', angle: 0, segments: [], length: 10 }
    ];

    for(let i=0; i<80; i++) spawnFood();
}

function spawnFood() {
    foods.push({ 
        x: Math.random() * canvas.width, 
        y: Math.random() * canvas.height, 
        radius: Math.random() * 3 + 4, 
        color: `hsl(${Math.random()*360}, 100%, 50%)` 
    });
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

    // OYUNCU HAREKETİ
    let speed = isBoosting && score > 5 ? snake.speed * 2 : snake.speed;
    if(isBoosting && score > 5) {
        score -= 0.05;
        snake.length -= 0.005;
    }
    snake.x += Math.cos(snake.angle) * speed;
    snake.y += Math.sin(snake.angle) * speed;
    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    // DUVAR KONTROLÜ
    if(snake.x < 0 || snake.x > canvas.width || snake.y < 0 || snake.y > canvas.height) gameOver();

    // YEMEK TOPLAMA
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < snake.radius + f.radius) {
            foods.splice(i, 1);
            score += 10;
            snake.length += 0.8;
            spawnFood();
        }
    });

    // --- %100 ZEKA BOT MANTIĞI ---
    bots.forEach(b => {
        // En yakın yemeği bulma (AI)
        let closestFood = foods[0];
        let minDist = Math.hypot(b.x - foods[0].x, b.y - foods[0].y);
        
        foods.forEach(f => {
            let d = Math.hypot(b.x - f.x, b.y - f.y);
            if(d < minDist) { minDist = d; closestFood = f; }
        });

        // Yemeğe doğru yönelme
        let targetAngle = Math.atan2(closestFood.y - b.y, closestFood.x - b.x);
        // Yumuşak dönüş
        let diff = targetAngle - b.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        b.angle += diff * 0.1;

        b.x += Math.cos(b.angle) * 2.8;
        b.y += Math.sin(b.angle) * 2.8;

        // Bot vücut takibi
        if(!b.segments) b.segments = [];
        b.segments.unshift({x: b.x, y: b.y});
        if(b.segments.length > b.length * 3) b.segments.pop();

        // Bot yemek yerse büyüme
        if(minDist < 20) {
            b.length += 0.5;
            b.score += 5;
        }
    });

    updateLeaderboard();
}

function updateLeaderboard() {
    let list = [...bots, {name: playerName, score: Math.floor(score)}].sort((a,b) => b.score - a.score);
    document.getElementById('lb-content').innerHTML = list.slice(0,5).map(p => `
        <div class="lb-item"><span>${p.name}</span><b>${Math.floor(p.score)}</b></div>
    `).join('');
    document.getElementById('scoreVal').innerText = Math.floor(score);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').innerText = Math.floor(score);
    goScreen.style.display = 'flex';
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yemekler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
    });

    // Botları Çiz (Vücutlarıyla birlikte)
    bots.forEach(b => {
        b.segments.forEach((seg, i) => {
            if(i % 3 === 0) {
                ctx.fillStyle = b.color;
                ctx.globalAlpha = 1 - (i / b.segments.length); // Kuyruğa doğru şeffaflaşma
                ctx.beginPath(); ctx.arc(seg.x, seg.y, 12, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.fillText(b.name, b.x - 20, b.y - 20);
    });

    // Oyuncuyu Çiz
    snake.segments.forEach((seg, i) => {
        if(i % 3 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI*2); ctx.fill();
            if(i === 0) { // Gözler
                ctx.fillStyle = "white";
                ctx.beginPath(); 
                ctx.arc(seg.x+6, seg.y-6, 5, 0, Math.PI*2); 
                ctx.arc(seg.x+6, seg.y+6, 5, 0, Math.PI*2); 
                ctx.fill();
            }
        }
    });

    drawMinimap();
}

function drawMinimap() {
    mCtx.clearRect(0,0,120,120);
    mCtx.fillStyle = '#A020F0';
    mCtx.beginPath(); mCtx.arc((snake.x/canvas.width)*120, (snake.y/canvas.height)*120, 4, 0, Math.PI*2); mCtx.fill();
    bots.forEach(b => {
        mCtx.fillStyle = b.color;
        mCtx.beginPath(); mCtx.arc((b.x/canvas.width)*120, (b.y/canvas.height)*120, 3, 0, Math.PI*2); mCtx.fill();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

document.getElementById('startBtn').onclick = () => {
    playerName = document.getElementById('pName').value || "Guest";
    menu.style.display = 'none';
    gameRunning = true;
};

document.getElementById('restartBtn').onclick = () => {
    goScreen.style.display = 'none';
    init();
    gameRunning = true;
};

document.getElementById('toMenuBtn').onclick = () => {
    goScreen.style.display = 'none';
    menu.style.display = 'flex';
    init();
};

init(); loop();

