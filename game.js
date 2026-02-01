/** * Purpleguy © 2026 - tablet power 
 * Snake.io Pro - Full Engine
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimap-canvas');
const mCtx = mCanvas.getContext('2d');

// --- OYUN AYARLARI ---
const WORLD_SIZE = 4000; // Harita boyutu
let gameRunning = false;
let score = 0;
let points = parseInt(localStorage.getItem('points')) || 0;
let foods = [];
let isBoosting = false;
let playerName = localStorage.getItem('savedPlayerName') || "";

// --- OYUNCU VE KAMERA ---
let camera = { x: 0, y: 0 };
let snake = { 
    x: WORLD_SIZE / 2, 
    y: WORLD_SIZE / 2, 
    radius: 15, 
    segments: [], 
    length: 20, 
    angle: 0, 
    speed: 4.5 
};

let bots = [];
let activeColor = "#A020F0";

// --- BAŞLATMA FONKSİYONU ---
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    mCanvas.width = 120;
    mCanvas.height = 120;

    if (playerName) {
        document.getElementById('pName').value = playerName;
    }
    
    // Botları Oluştur (İsimler ve Rastgele Başlangıç Skorları)
    const botNames = ["Alpha", "Viper_99", "Shadow", "NeonHunter", "Ghost_Efe", "King_Snake", "Dragon", "Warrior", "Slayer"];
    for (let i = 0; i < 30; i++) {
        bots.push({
            name: botNames[i % botNames.length] + "_" + (i + 1),
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            segments: [],
            length: 25 + Math.random() * 35,
            angle: Math.random() * 6.2,
            speed: 3.5,
            score: Math.floor(Math.random() * 800)
        });
    }

    // Yemekleri Serpiştir
    for (let i = 0; i < 600; i++) {
        spawnFood();
    }
}

function spawnFood() {
    foods.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        radius: Math.random() * 3 + 4,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

// --- KONTROL SİSTEMLERİ ---
const joy = document.getElementById('joystick-wrapper');
const stick = document.getElementById('joystick-stick');

joy.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joy.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    snake.angle = Math.atan2(dy, dx);
    
    const distance = Math.min(Math.hypot(dx, dy), rect.width / 2);
    const moveX = Math.cos(snake.angle) * distance;
    const moveY = Math.sin(snake.angle) * distance;
    
    stick.style.transform = `translate(${moveX}px, ${moveY}px)`;
}, { passive: false });

joy.addEventListener('touchend', () => {
    stick.style.transform = `translate(0px, 0px)`;
});

const boostBtn = document.getElementById('boost-btn');
boostBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isBoosting = true;
    boostBtn.style.background = "rgba(160,32,240,0.6)";
});

boostBtn.addEventListener('touchend', () => {
    isBoosting = false;
    boostBtn.style.background = "rgba(160,32,240,0.2)";
});

// --- ADMİN TETİKLEYİCİ ---
let sigCount = 0;
window.handleSigClick = () => {
    sigCount++;
    if (sigCount >= 3) {
        document.getElementById('adminPanel').style.display = 'block';
        sigCount = 0;
    }
};

window.addPowerAdmin = () => {
    for (let i = 0; i < 50; i++) spawnFood();
    score += 1000;
    snake.length += 15;
};

window.closeAdmin = () => {
    document.getElementById('adminPanel').style.display = 'none';
};

// --- ANA OYUN DÖNGÜSÜ (GÜNCELLEME) ---
function update() {
    if (!gameRunning) return;
    
    // Hız Hesaplama
    let currentSpeed = snake.speed;
    if (isBoosting && score > 50) {
        currentSpeed = 9;
        score -= 0.2;
        snake.length -= 0.03;
    }

    // Yılanı Hareket Ettir
    snake.x += Math.cos(snake.angle) * currentSpeed;
    snake.y += Math.sin(snake.angle) * currentSpeed;

    // Kamera Takibi
    camera.x = snake.x - canvas.width / 2;
    camera.y = snake.y - canvas.height / 2;

    // Vücut Segmentlerini Güncelle
    snake.segments.unshift({ x: snake.x, y: snake.y });
    if (snake.segments.length > snake.length * 3) {
        snake.segments.pop();
    }

    // Sınır Kontrolü
    if (snake.x < 0 || snake.x > WORLD_SIZE || snake.y < 0 || snake.y > WORLD_SIZE) {
        gameOver();
    }

    // Yemek Yeme Kontrolü
    for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];
        let dist = Math.hypot(snake.x - f.x, snake.y - f.y);
        if (dist < 25) {
            score += 15;
            snake.length += 0.5;
            foods.splice(i, 1);
            spawnFood();
        }
    }

    // Botların Hareketi
    bots.forEach(bot => {
        bot.x += Math.cos(bot.angle) * bot.speed;
        bot.y += Math.sin(bot.angle) * bot.speed;
        
        bot.segments.unshift({ x: bot.x, y: bot.y });
        if (bot.segments.length > bot.length * 3) {
            bot.segments.pop();
        }

        // Rastgele yön değiştirme
        if (Math.random() < 0.02) bot.angle += (Math.random() - 0.5) * 1;

        // Duvarlardan dönme
        if (bot.x < 100 || bot.x > WORLD_SIZE - 100 || bot.y < 100 || bot.y > WORLD_SIZE - 100) {
            bot.angle += 0.2;
        }

        // Çarpışma Kontrolü (Sen bota çarparsan)
        let headDist = Math.hypot(snake.x - bot.x, snake.y - bot.y);
        if (headDist < 20) gameOver();
    });

    updateUI();
}

// --- ÇİZİM FONKSİYONU ---
function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Arkaplan Izgarası (Grid)
    ctx.strokeStyle = "#151515";
    ctx.lineWidth = 2;
    for (let x = 0; x <= WORLD_SIZE; x += 200) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); ctx.stroke();
    }
    for (let y = 0; y <= WORLD_SIZE; y += 200) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); ctx.stroke();
    }

    // Yemekleri Çiz
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Botları Çiz
    bots.forEach(bot => {
        bot.segments.forEach((seg, index) => {
            ctx.fillStyle = bot.color;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, 14, 0, Math.PI * 2);
            ctx.fill();
            if (index === 0) drawEyes(seg.x, seg.y, bot.angle);
        });
    });

    // Kendi Yılanını Çiz
    snake.segments.forEach((seg, index) => {
        ctx.fillStyle = index === 0 ? "white" : activeColor;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI * 2);
        ctx.fill();
        if (index === 0) drawEyes(seg.x, seg.y, snake.angle);
    });

    ctx.restore();
    drawMinimap();
}

// Göz Çizimi Yardımcı Fonksiyonu
function drawEyes(x, y, angle) {
    ctx.fillStyle = "white";
    let eyeOffset = 8;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle + 0.5) * eyeOffset, y + Math.sin(angle + 0.5) * eyeOffset, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle - 0.5) * eyeOffset, y + Math.sin(angle - 0.5) * eyeOffset, 4, 0, Math.PI * 2);
    ctx.fill();
}

// Mini Harita Çizimi
function drawMinimap() {
    mCtx.clearRect(0, 0, 120, 120);
    mCtx.fillStyle = "rgba(160,32,240,0.8)";
    let mx = (snake.x / WORLD_SIZE) * 120;
    let my = (snake.y / WORLD_SIZE) * 120;
    mCtx.beginPath();
    mCtx.arc(mx, my, 4, 0, Math.PI * 2);
    mCtx.fill();
}

// Liderlik Tablosu Güncelleme
function updateUI() {
    document.getElementById('liveScore').innerText = Math.floor(score);
    let allParticipants = [...bots, { name: playerName || "Siz", score: Math.floor(score) }];
    allParticipants.sort((a, b) => b.score - a.score);
    
    let leaderHTML = "";
    allParticipants.slice(0, 6).forEach(p => {
        leaderHTML += `<div class="leader-item"><span>${p.name}</span><span>${p.score}</span></div>`;
    });
    document.getElementById('leaderboardList').innerHTML = leaderHTML;
}

// Oyun Bitiş Fonksiyonu
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScoreDisplay').innerText = "Skor: " + Math.floor(score);
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Başlat Butonu
window.startGame = () => {
    let inputName = document.getElementById('pName').value.trim();
    if (inputName === "") return;
    playerName = inputName;
    localStorage.setItem('savedPlayerName', playerName);
    document.getElementById('menu').style.display = 'none';
    gameRunning = true;
};

// --- MOTORU ÇALIŞTIR ---
init();
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
