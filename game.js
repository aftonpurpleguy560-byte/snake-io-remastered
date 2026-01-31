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
let playerName = "";

let snake = { x: 0, y: 0, radius: 14, segments: [], length: 18, angle: 0, speed: 3.5, color: '#A020F0' };
let bots = [];

const botColors = ['#00CCFF', '#00FF00', '#FF0000', '#FFD700', '#FF69B4'];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    snake.x = canvas.width / 2;
    snake.y = canvas.height / 2;
    snake.segments = [];
    snake.length = 18;
    score = 0;
    foods = [];

    // Başlangıç botları - Daha rekabetçi skorlar
    bots = [
        { id: 1, name: "Alpha_Predator", x: 200, y: 200, score: 500, color: botColors[2], angle: Math.random()*6, segments: [], length: 25, speed: 3 },
        { id: 2, name: "Shadow_Snake", x: canvas.width - 200, y: 200, score: 400, color: botColors[0], angle: Math.random()*6, segments: [], length: 20, speed: 3 },
        { id: 3, name: "Neon_Hunter", x: 200, y: canvas.height - 200, score: 300, color: botColors[1], angle: Math.random()*6, segments: [], length: 15, speed: 3 }
    ];

    for(let i=0; i<120; i++) spawnFood();
}

function spawnFood(x, y, radius, color) {
    foods.push({ 
        x: x || Math.random() * canvas.width, 
        y: y || Math.random() * canvas.height, 
        radius: radius || Math.random() * 3 + 4, 
        color: color || `hsl(${Math.random()*360}, 100%, 50%)`,
        isLoot: radius > 5 
    });
}

// JOYSTICK SİSTEMİ
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

    // --- OYUNCU HAREKETİ ---
    let speed = isBoosting && score > 10 ? snake.speed * 2.2 : snake.speed;
    if(isBoosting && score > 10) { score -= 0.15; snake.length -= 0.01; }
    
    snake.x += Math.cos(snake.angle) * speed;
    snake.y += Math.sin(snake.angle) * speed;
    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    if(snake.x < 0 || snake.x > canvas.width || snake.y < 0 || snake.y > canvas.height) gameOver();

    // --- %100 GERÇEKÇİ BOT AI (DAİRE ÇİZME BUGI ÇÖZÜLDÜ) ---
    bots.forEach(b => {
        let sensorDist = 100; 
        let danger = false;

        // Önündeki engeli sezme (Oyuncu veya diğer botlar)
        snake.segments.forEach((seg, i) => {
            if(i % 5 === 0 && Math.hypot(b.x + Math.cos(b.angle)*sensorDist - seg.x, b.y + Math.sin(b.angle)*sensorDist - seg.y) < 50) danger = true;
        });
        
        bots.forEach(other => {
            if(other.id !== b.id) {
                other.segments.forEach((seg, i) => {
                    if(i % 5 === 0 && Math.hypot(b.x + Math.cos(b.angle)*sensorDist - seg.x, b.y + Math.sin(b.angle)*sensorDist - seg.y) < 50) danger = true;
                } );
            }
        });

        if(danger) {
            b.angle += 0.5; // Ani ve sert dönüş (Daire çizmeyi kırar)
            b.speed = 4.5;
        } else {
            b.speed = 2.8;
            let closestFood = foods[0];
            let minDist = 9999;
            foods.forEach(f => {
                let d = Math.hypot(b.x - f.x, b.y - f.y);
                if(d < minDist) { minDist = d; closestFood = f; }
            });
            let targetAngle = Math.atan2(closestFood.y - b.y, closestFood.x - b.x);
            let diff = targetAngle - b.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            b.angle += diff * 0.15;
        }

        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        
        // Duvardan kaçış
        if(b.x < 100 || b.x > canvas.width - 100 || b.y < 100 || b.y > canvas.height - 100) b.angle += 0.3;

        b.segments.unshift({x: b.x, y: b.y});
        if(b.segments.length > b.length * 3) b.segments.pop();
    });

    // --- HITBOX VE ÇARPIŞMALAR ---
    bots.forEach(bot => {
        // Sen bota çarparsan ölürsün
        bot.segments.forEach((seg, sIdx) => {
            if (sIdx > 10 && Math.hypot(snake.x - seg.x, snake.y - seg.y) < snake.radius + 5) gameOver();
        });
        // Bot sana çarparsa bot ölür
        snake.segments.forEach((seg, sIdx) => {
            if (sIdx > 10 && Math.hypot(bot.x - seg.x, bot.y - seg.y) < 15) {
                bot.segments.forEach((bs, bi) => { if(bi % 4 === 0) spawnFood(bs.x, bs.y, 8, bot.color); });
                bot.x = Math.random()*canvas.width; bot.y = Math.random()*canvas.height;
                bot.segments = []; bot.length = 15; bot.score = 100;
            }
        });
    });

    // Yemek Toplama
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < snake.radius + f.radius) {
            foods.splice(i, 1); score += f.isLoot ? 50 : 10; snake.length += 0.8; spawnFood();
        }
        bots.forEach(b => {
            if(Math.hypot(b.x - f.x, b.y - f.y) < 20) {
                foods.splice(i, 1); b.length += 0.6; b.score += 12; spawnFood();
            }
        });
    });

    updateLeaderboard();
}

function updateLeaderboard() {
    let list = [...bots, {name: playerName, score: Math.floor(score)}].sort((a,b) => b.score - a.score);
    document.getElementById('lb-content').innerHTML = list.slice(0,5).map(p => `
        <div class="lb-item" style="color:${p.name === playerName ? '#fff' : '#ccc'}">
            <span>${p.name}</span><b>${Math.floor(p.score)}</b>
        </div>
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

    // Yemekler (Parlamalı)
    foods.forEach(f => {
        if(f.isLoot) { ctx.shadowBlur = 15; ctx.shadowColor = f.color; }
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Botlar
    bots.forEach(b => {
        b.segments.forEach((seg, i) => {
            if(i % 3 === 0) {
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.arc(seg.x, seg.y, 13 - (i*0.03), 0, Math.PI*2); ctx.fill();
            }
        });
        // Bot Gözleri
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(b.x + 5, b.y - 5, 4, 0, Math.PI*2); ctx.arc(b.x + 5, b.y + 5, 4, 0, Math.PI*2); ctx.fill();
    });

    // Oyuncu (Sprite/Kafa Detayı)
    snake.segments.forEach((seg, i) => {
        if(i % 3 === 0) {
            let grad = ctx.createRadialGradient(seg.x, seg.y, 2, seg.x, seg.y, snake.radius);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(1, snake.color);
            ctx.fillStyle = (i === 0) ? grad : snake.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius - (i*0.02), 0, Math.PI*2); ctx.fill();
            
            if(i === 0) {
                ctx.fillStyle = "white";
                ctx.beginPath(); ctx.arc(seg.x+8, seg.y-6, 6, 0, Math.PI*2); ctx.arc(seg.x+8, seg.y+6, 6, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = "black";
                ctx.beginPath(); ctx.arc(seg.x+10, seg.y-6, 3, 0, Math.PI*2); ctx.arc(seg.x+10, seg.y+6, 3, 0, Math.PI*2); ctx.fill();
            }
        }
    });
    drawMinimap();
}

function drawMinimap() {
    mCtx.clearRect(0,0,120,120);
    mCtx.fillStyle = snake.color;
    mCtx.beginPath(); mCtx.arc((snake.x/canvas.width)*120, (snake.y/canvas.height)*120, 4, 0, Math.PI*2); mCtx.fill();
    bots.forEach(b => {
        mCtx.fillStyle = b.color;
        mCtx.beginPath(); mCtx.arc((b.x/canvas.width)*120, (b.y/canvas.height)*120, 2, 0, Math.PI*2); mCtx.fill();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

window.setSkin = (color, el) => {
    snake.color = color;
    document.querySelectorAll('.skin').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
};

document.getElementById('startBtn').onclick = () => {
    const nameInput = document.getElementById('pName');
    if (!nameInput.value.trim()) {
        nameInput.style.borderColor = "red";
        nameInput.placeholder = "İSİM ZORUNLU!";
        return;
    }
    playerName = nameInput.value;
    menu.style.display = 'none';
    gameRunning = true;
};

document.getElementById('restartBtn').onclick = () => { goScreen.style.display = 'none'; init(); gameRunning = true; };
document.getElementById('toMenuBtn').onclick = () => { goScreen.style.display = 'none'; menu.style.display = 'flex'; init(); };

init(); loop();

