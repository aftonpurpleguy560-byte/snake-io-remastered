const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shopItemsDiv = document.getElementById('shopItems');

const WORLD_SIZE = 5000; 
let gameRunning = false;
let score = 0;
let points = parseInt(localStorage.getItem('points')) || 0;
let foods = [];
let isBoosting = false;
let playerName = localStorage.getItem('lastPlayerName') || ""; // İSİM HAFIZASI

// ADMIN PANEL MOBİL SİSTEMİ
let sigClickCount = 0;
window.handleSignatureClick = () => {
    sigClickCount++;
    if(sigClickCount >= 3) {
        document.getElementById('adminPanel').style.display = 'block';
        sigClickCount = 0;
    }
};

// MARKET VE PUAN
let skins = [
    { name: "Mor", color: "#A020F0", price: 0, owned: true },
    { name: "Neon", color: "#00CCFF", price: 500, owned: false },
    { name: "Altın", color: "#FFD700", price: 2000, owned: false }
];
let activeColor = "#A020F0";

let snake = { x: WORLD_SIZE/2, y: WORLD_SIZE/2, radius: 14, segments: [], length: 18, angle: 0, speed: 4 };
let bots = [];
let camera = { x: 0, y: 0 };

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Hatırlanan ismi kutuya yaz
    if(playerName) document.getElementById('pName').value = playerName;
    
    loadShop();
    updatePointsUI();
    
    bots = [];
    for(let i=0; i<30; i++) {
        bots.push({
            id: i, x: Math.random()*WORLD_SIZE, y: Math.random()*WORLD_SIZE,
            color: `hsl(${Math.random()*360}, 100%, 50%)`,
            segments: [], length: 25, angle: Math.random()*6, speed: 3
        });
    }
    for(let i=0; i<600; i++) spawnFood();
}

function spawnFood(x, y, isPowerUp = false) {
    foods.push({
        x: x || Math.random() * WORLD_SIZE,
        y: y || Math.random() * WORLD_SIZE,
        radius: isPowerUp ? 15 : Math.random() * 3 + 4,
        color: isPowerUp ? "#FF00FF" : `hsl(${Math.random()*360}, 100%, 50%)`,
        isPowerUp: isPowerUp
    });
}

// KONTROLLER
const joyWrapper = document.getElementById('joystick-wrapper');
const stick = document.getElementById('joystick-stick');
function move(e) {
    if(!gameRunning) return;
    const t = e.touches[0];
    const r = joyWrapper.getBoundingClientRect();
    const dx = t.clientX - (r.left + r.width/2);
    const dy = t.clientY - (r.top + r.height/2);
    snake.angle = Math.atan2(dy, dx);
    const d = Math.min(Math.hypot(dx, dy), r.width/2);
    stick.style.transform = `translate(${Math.cos(snake.angle)*d}px, ${Math.sin(snake.angle)*d}px)`;
}
joyWrapper.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, {passive:false});
document.getElementById('boost-btn').ontouchstart = (e) => { e.preventDefault(); isBoosting = true; };
document.getElementById('boost-btn').ontouchend = () => isBoosting = false;
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'p') document.getElementById('adminPanel').style.display = 'block'; });

function update() {
    if(!gameRunning) return;

    let speed = isBoosting && score > 20 ? snake.speed * 2.5 : snake.speed;
    if(isBoosting && score > 20) { score -= 0.2; snake.length -= 0.02; }

    snake.x += Math.cos(snake.angle) * speed;
    snake.y += Math.sin(snake.angle) * speed;
    camera.x = snake.x - canvas.width/2;
    camera.y = snake.y - canvas.height/2;

    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    // Hitbox ve Yemek
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < 30) {
            if(f.isPowerUp) { // Purpleguy Power-up: Devasa büyüme
                score += 500; snake.length += 15;
            } else {
                score += 10; snake.length += 0.5;
            }
            foods.splice(i, 1); spawnFood();
        }
    });

    bots.forEach(b => {
        // Çarpışma: Oyuncu ölür
        b.segments.forEach((seg, i) => {
            if(i > 8 && Math.hypot(snake.x - seg.x, snake.y - seg.y) < 15) gameOver();
        });
        // Çarpışma: Bot ölür
        snake.segments.forEach((seg, i) => {
            if(i > 8 && Math.hypot(b.x - seg.x, b.y - seg.y) < 15) {
                b.segments.forEach((s, idx) => { if(idx%5===0) spawnFood(s.x, s.y); });
                b.x = Math.random()*WORLD_SIZE; b.y = Math.random()*WORLD_SIZE; b.segments = [];
            }
        });
        
        b.x += Math.cos(b.angle)*b.speed; b.y += Math.sin(b.angle)*b.speed;
        b.segments.unshift({x:b.x, y:b.y}); if(b.segments.length > b.length*3) b.segments.pop();
        if(b.x<0 || b.x>WORLD_SIZE || b.y<0 || b.y>WORLD_SIZE) b.angle += 0.5;
    });
}

function draw() {
    ctx.fillStyle = "black"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    
    // Sınırlar ve Izgara
    ctx.strokeStyle = "#222"; ctx.strokeRect(0,0,WORLD_SIZE,WORLD_SIZE);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        if(f.isPowerUp) { ctx.shadowBlur = 20; ctx.shadowColor = "magenta"; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    bots.forEach(b => {
        b.segments.forEach(s => {
            ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(s.x, s.y, 13, 0, Math.PI*2); ctx.fill();
        });
    });

    snake.segments.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "white" : activeColor;
        ctx.beginPath(); ctx.arc(s.x, s.y, snake.radius, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
}

function gameOver() {
    gameRunning = false;
    points += (score / 100) * 75;
    localStorage.setItem('points', points);
    alert("Öldün! Skor: " + Math.floor(score));
    location.reload();
}

window.startGame = () => {
    let inputName = document.getElementById('pName').value.trim().toLowerCase();
    
    // MONSTER ADI KORUMASI VE İSİM HAFIZASI
    if(!inputName) return alert("İsim yaz!");
    if(inputName === "monster") return alert("Bu isim özeldir, kullanılamaz!");
    
    playerName = inputName;
    localStorage.setItem('lastPlayerName', playerName); // İsim hafızaya alındı
    
    document.getElementById('menu').style.display = 'none';
    gameRunning = true;
};

// Purpleguy Power-up admin panelinden manuel de atılabilir
window.addScoreAdmin = () => { spawnFood(snake.x + 50, snake.y + 50, true); };

init(); loop();
