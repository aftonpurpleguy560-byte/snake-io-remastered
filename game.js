const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shopItemsDiv = document.getElementById('shopItems');

// AYARLAR
const WORLD_SIZE = 4500;
let gameRunning = false;
let score = 0;
let points = parseInt(localStorage.getItem('points')) || 0;
let foods = [];
let isBoosting = false;
let playerName = localStorage.getItem('savedPlayerName') || "";

// KAMERA VE OYUNCU
let camera = { x: 0, y: 0 };
let snake = { x: WORLD_SIZE/2, y: WORLD_SIZE/2, radius: 14, segments: [], length: 18, angle: 0, speed: 4 };
let bots = [];
let activeColor = "#A020F0";

// MARKET
let skins = [
    { name: "Mor Standart", color: "#A020F0", price: 0, owned: true },
    { name: "Neon Buz", color: "#00CCFF", price: 500, owned: false },
    { name: "Zümrüt Göz", color: "#00FF00", price: 1200, owned: false },
    { name: "Saf Altın", color: "#FFD700", price: 2500, owned: false }
];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(playerName) document.getElementById('pName').value = playerName;
    loadShop();
    updatePointsUI();
    
    bots = [];
    for(let i=0; i<30; i++) {
        bots.push({
            id: i, x: Math.random()*WORLD_SIZE, y: Math.random()*WORLD_SIZE,
            color: `hsl(${Math.random()*360}, 100%, 50%)`,
            segments: [], length: 25 + Math.random()*30, angle: Math.random()*6, speed: 3
        });
    }
    for(let i=0; i<600; i++) spawnFood();
}

// FOOD & POWER-UP
function spawnFood(x, y, isPowerUp = false) {
    foods.push({
        x: x || Math.random() * WORLD_SIZE,
        y: y || Math.random() * WORLD_SIZE,
        radius: isPowerUp ? 18 : Math.random() * 3 + 4,
        color: isPowerUp ? "#FF00FF" : `hsl(${Math.random()*360}, 100%, 50%)`,
        isPowerUp: isPowerUp
    });
}

// --- ADMIN SİSTEMİ ---
let sigClick = 0;
window.handleSignatureClick = () => {
    sigClick++;
    if(sigClick >= 3) {
        document.getElementById('adminPanel').style.display = 'block';
        sigClick = 0;
    }
};
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'p') document.getElementById('adminPanel').style.display = 'block'; });

window.addPowerUpAdmin = () => { spawnFood(snake.x + 100, snake.y + 100, true); };
window.killAllBots = () => { 
    bots.forEach(b => b.segments.forEach(s => spawnFood(s.x, s.y)));
    bots = []; 
};
window.closeAdmin = () => document.getElementById('adminPanel').style.display = 'none';

// --- KONTROLLER (SADECE MOVEPAD) ---
const joy = document.getElementById('joystick-wrapper');
const stick = document.getElementById('joystick-stick');

function handleJoy(e) {
    if(!gameRunning) return;
    const t = e.touches[0];
    const r = joy.getBoundingClientRect();
    const dx = t.clientX - (r.left + r.width/2);
    const dy = t.clientY - (r.top + r.height/2);
    snake.angle = Math.atan2(dy, dx);
    const d = Math.min(Math.hypot(dx, dy), r.width/2);
    stick.style.transform = `translate(${Math.cos(snake.angle)*d}px, ${Math.sin(snake.angle)*d}px)`;
}
joy.addEventListener('touchstart', (e) => { e.preventDefault(); handleJoy(e); }, {passive:false});
joy.addEventListener('touchmove', (e) => { e.preventDefault(); handleJoy(e); }, {passive:false});
joy.addEventListener('touchend', () => { stick.style.transform = `translate(0px, 0px)`; });

document.getElementById('boost-btn').addEventListener('touchstart', (e) => { e.preventDefault(); isBoosting = true; }, {passive:false});
document.getElementById('boost-btn').addEventListener('touchend', () => isBoosting = false);

// OYUN DÖNGÜSÜ
function update() {
    if(!gameRunning) return;

    let s = isBoosting && score > 25 ? snake.speed * 2.3 : snake.speed;
    if(isBoosting && score > 25) { score -= 0.15; snake.length -= 0.015; }

    snake.x += Math.cos(snake.angle) * s;
    snake.y += Math.sin(snake.angle) * s;
    camera.x = snake.x - canvas.width/2;
    camera.y = snake.y - canvas.height/2;

    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    if(snake.x < 0 || snake.x > WORLD_SIZE || snake.y < 0 || snake.y > WORLD_SIZE) gameOver();

    // Yemek & PowerUp
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < 28) {
            if(f.isPowerUp) { score += 800; snake.length += 15; }
            else { score += 10; snake.length += 0.5; }
            foods.splice(i, 1); spawnFood();
        }
    });

    // Botlar & Hitbox
    bots.forEach(b => {
        b.x += Math.cos(b.angle)*b.speed; b.y += Math.sin(b.angle)*b.speed;
        b.segments.unshift({x:b.x, y:b.y}); if(b.segments.length > b.length*3) b.segments.pop();
        if(b.x<100 || b.x>WORLD_SIZE-100 || b.y<100 || b.y>WORLD_SIZE-100) b.angle += 0.3;

        // Sen bota çarparsan
        b.segments.forEach((seg, i) => {
            if(i > 10 && Math.hypot(snake.x - seg.x, snake.y - seg.y) < 15) gameOver();
        });
        // Bot sana çarparsa
        snake.segments.forEach((seg, i) => {
            if(i > 10 && Math.hypot(b.x - seg.x, b.y - seg.y) < 15) {
                b.segments.forEach(s => spawnFood(s.x, s.y));
                b.x = Math.random()*WORLD_SIZE; b.y = Math.random()*WORLD_SIZE; b.segments = [];
            }
        });
    });
    document.getElementById('liveScore').innerText = Math.floor(score);
}

function draw() {
    ctx.fillStyle = "black"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    
    // Grid
    ctx.strokeStyle = "#111";
    for(let x=0; x<WORLD_SIZE; x+=200) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,WORLD_SIZE); ctx.stroke(); }
    for(let y=0; y<WORLD_SIZE; y+=200) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD_SIZE,y); ctx.stroke(); }

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        if(f.isPowerUp) { ctx.shadowBlur = 20; ctx.shadowColor = "magenta"; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    bots.forEach(b => {
        b.segments.forEach(s => { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(s.x, s.y, 13, 0, Math.PI*2); ctx.fill(); });
    });

    snake.segments.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "white" : activeColor;
        ctx.beginPath(); ctx.arc(s.x, s.y, snake.radius, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
}

// SİSTEM FONKSİYONLARI
function gameOver() {
    gameRunning = false;
    points += (score / 100) * 75;
    localStorage.setItem('points', points);
    alert("Öldün! Kazanılan Puan: " + Math.floor((score/100)*75));
    location.reload();
}

window.startGame = () => {
    let name = document.getElementById('pName').value.trim();
    if(!name) return alert("İsim gir!");
    if(name.toLowerCase() === "monster") return alert("Bu isim yasaklıdır!");
    
    playerName = name;
    localStorage.setItem('savedPlayerName', playerName);
    document.getElementById('menu').style.display = 'none';
    gameRunning = true;
};

function loadShop() {
    let owned = JSON.parse(localStorage.getItem('ownedSkins')) || [true, false, false, false];
    skins.forEach((s, i) => s.owned = owned[i]);
    shopItemsDiv.innerHTML = skins.map((s, i) => `
        <div class="shop-item">
            <span style="color:${s.color}">● ${s.name}</span>
            <button class="${s.owned ? 'select-btn' : 'buy-btn'}" onclick="handleShop(${i})">
                ${s.owned ? 'Seç' : s.price + ' P'}
            </button>
        </div>`).join('');
}

window.handleShop = (i) => {
    let s = skins[i];
    if(s.owned) activeColor = s.color;
    else if(points >= s.price) {
        points -= s.price; s.owned = true;
        localStorage.setItem('ownedSkins', JSON.stringify(skins.map(sk => sk.owned)));
        localStorage.setItem('points', points);
        loadShop(); updatePointsUI();
    }
};

function updatePointsUI() { document.getElementById('userPoints').innerText = Math.floor(points); }
function loop() { update(); draw(); requestAnimationFrame(loop); }
init(); loop();

