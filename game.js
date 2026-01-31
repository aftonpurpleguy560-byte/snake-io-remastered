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

// BOT SİSTEMİ
let bots = [
    { name: "Pro_Slayer", x: 500, y: 500, score: 450, color: '#00FF00' },
    { name: "Snake_Master", x: 1000, y: 200, score: 320, color: '#FF0000' },
    { name: "Ghost_Killer", x: 200, y: 800, score: 150, color: '#00CCFF' }
];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    snake.x = Math.random() * canvas.width;
    snake.y = Math.random() * canvas.height;
    score = 0;
    snake.length = 12;
    snake.segments = [];
}

// JOYSTICK
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
        score -= 0.1;
        snake.length -= 0.01;
        if(Math.random() > 0.8) foods.push({x: snake.x, y: snake.y, radius: 3, color: snake.color});
    }

    snake.x += Math.cos(snake.angle) * speed;
    snake.y += Math.sin(snake.angle) * speed;
    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    // ÖLÜM KONTROLÜ (Çarpınca Menüye Dön)
    if(snake.x < 0 || snake.x > canvas.width || snake.y < 0 || snake.y > canvas.height) gameOver();
    
    // Kendi vücuduna çarpma
    for(let i = 25; i < snake.segments.length; i++) {
        if(Math.hypot(snake.x - snake.segments[i].x, snake.y - snake.segments[i].y) < 10) gameOver();
    }

    // Yiyecek Toplama
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < snake.radius + f.radius) {
            foods.splice(i, 1);
            score += 10;
            snake.length += 1;
        }
    });

    if(foods.length < 50) foods.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: 5, color: 'white'});

    // Botların skorlarını rastgele arttıralım (Gerçekçilik için)
    bots.forEach(b => { if(Math.random() > 0.99) b.score += 5; });

    updateLeaderboard();
}

function updateLeaderboard() {
    let list = [...bots, {name: playerName, score: Math.floor(score)}].sort((a,b) => b.score - a.score);
    lbContent.innerHTML = list.map(p => `<div class="lb-item"><span>${p.name}</span><b>${Math.floor(p.score)}</b></div>`).join('');
    document.getElementById('scoreVal').innerText = Math.floor(score);
}

function gameOver() {
    gameRunning = false;
    menu.style.display = 'flex'; // Alert yerine direkt menüyü göster
    init(); // Oyunu sıfırla
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#111';
    for(let i=0; i<canvas.width; i+=100) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }

    foods.forEach(f => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill(); });

    // Yılan Çizimi
    snake.segments.forEach((seg, i) => {
        if(i % 3 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI*2); ctx.fill();
            if(i === 0) { // Kafa/Sprite
                ctx.fillStyle = "white";
                ctx.beginPath(); ctx.arc(seg.x+6, seg.y-6, 5, 0, Math.PI*2); ctx.arc(seg.x+6, seg.y+6, 5, 0, Math.PI*2); ctx.fill();
            }
        }
    });

    drawMinimap();
}

function drawMinimap() {
    mCtx.clearRect(0,0,150,150);
    // Kendi konumun
    mCtx.fillStyle = '#A020F0';
    mCtx.beginPath(); mCtx.arc((snake.x/canvas.width)*150, (snake.y/canvas.height)*150, 4, 0, Math.PI*2); mCtx.fill();
    // Botların konumu (Kırmızı noktalar)
    mCtx.fillStyle = 'red';
    bots.forEach(b => {
        mCtx.beginPath(); mCtx.arc((b.x/canvas.width)*150, (b.y/canvas.height)*150, 3, 0, Math.PI*2); mCtx.fill();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.setSkin = (c, el) => {
    snake.color = c;
    document.querySelectorAll('.skin').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
};

document.getElementById('startBtn').onclick = () => {
    playerName = document.getElementById('pName').value || "Guest";
    menu.style.display = 'none';
    gameRunning = true;
};

init(); loop();

