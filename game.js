const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const shopItemsDiv = document.getElementById('shopItems');

// OYUN AYARLARI
const WORLD_SIZE = 4000; // Harita devasa
let gameRunning = false;
let score = 0;
let points = parseInt(localStorage.getItem('points')) || 0;
let foods = [];
let isBoosting = false;
let playerName = "";

// KAMERA SİSTEMİ
let camera = { x: 0, y: 0 };

// MARKET SİSTEMİ (100 SKOR = 75 PUAN)
let skins = [
    { name: "Mor (Başlangıç)", color: "#A020F0", price: 0, owned: true },
    { name: "Mavi Neon", color: "#00CCFF", price: 500, owned: false },
    { name: "Zümrüt", color: "#00FF00", price: 1000, owned: false },
    { name: "Altın", color: "#FFD700", price: 2500, owned: false },
    { name: "Kıyamet", color: "#FF0000", price: 5000, owned: false }
];
let activeColor = "#A020F0";

let snake = { x: WORLD_SIZE/2, y: WORLD_SIZE/2, radius: 14, segments: [], length: 18, angle: 0, speed: 4 };
let bots = [];

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    loadShop();
    updatePointsUI();
    
    bots = [];
    for(let i=0; i<20; i++) {
        bots.push({
            id: i,
            name: "Bot_"+i,
            x: Math.random()*WORLD_SIZE,
            y: Math.random()*WORLD_SIZE,
            color: `hsl(${Math.random()*360}, 100%, 50%)`,
            segments: [],
            length: 20 + Math.random()*30,
            angle: Math.random()*6,
            speed: 3
        });
    }
    for(let i=0; i<400; i++) spawnFood();
}

function spawnFood() {
    foods.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        radius: Math.random() * 3 + 4,
        color: `hsl(${Math.random()*360}, 100%, 50%)`
    });
}

// MARKET VE PUAN SİSTEMİ
function loadShop() {
    let savedSkins = JSON.parse(localStorage.getItem('ownedSkins'));
    if(savedSkins) skins.forEach((s, i) => s.owned = savedSkins[i]);
    
    shopItemsDiv.innerHTML = "";
    skins.forEach((skin, index) => {
        let btnText = skin.owned ? "Kostümü Seç" : skin.price + " Puan";
        let btnClass = skin.owned ? "select-btn" : "buy-btn";
        shopItemsDiv.innerHTML += `
            <div class="shop-item">
                <span style="color:${skin.color}">● ${skin.name}</span>
                <button class="shop-btn ${btnClass}" onclick="handleShop(${index})">${btnText}</button>
            </div>`;
    });
}

function handleShop(index) {
    let skin = skins[index];
    if(skin.owned) {
        activeColor = skin.color;
    } else if(points >= skin.price) {
        points -= skin.price;
        skin.owned = true;
        saveData();
        loadShop();
        updatePointsUI();
    }
}

function saveData() {
    localStorage.setItem('points', points);
    localStorage.setItem('ownedSkins', JSON.stringify(skins.map(s => s.owned)));
}

function updatePointsUI() {
    document.getElementById('userPoints').innerText = Math.floor(points);
}

// --- SADECE MOVEPAD (JOYSTICK) SİSTEMİ ---
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
    const dist = Math.hypot(dx, dy);
    
    snake.angle = Math.atan2(dy, dx);
    
    const moveDist = Math.min(dist, rect.width / 2);
    const stickX = Math.cos(snake.angle) * moveDist;
    const stickY = Math.sin(snake.angle) * moveDist;
    
    stick.style.transform = `translate(${stickX}px, ${stickY}px)`;
}, { passive: false });

joyWrapper.addEventListener('touchend', () => {
    stick.style.transform = `translate(0px, 0px)`;
});

// BOOST BUTONU
document.getElementById('boost-btn').ontouchstart = (e) => { e.preventDefault(); isBoosting = true; };
document.getElementById('boost-btn').ontouchend = () => { isBoosting = false; };

function update() {
    if(!gameRunning) return;

    let speed = isBoosting && score > 20 ? snake.speed * 2 : snake.speed;
    if(isBoosting && score > 20) { score -= 0.2; snake.length -= 0.02; }

    snake.x += Math.cos(snake.angle) * speed;
    snake.y += Math.sin(snake.angle) * speed;

    camera.x = snake.x - canvas.width / 2;
    camera.y = snake.y - canvas.height / 2;

    snake.segments.unshift({x: snake.x, y: snake.y});
    if(snake.segments.length > snake.length * 3) snake.segments.pop();

    if(snake.x < 0 || snake.x > WORLD_SIZE || snake.y < 0 || snake.y > WORLD_SIZE) gameOver();

    // Bot Zekası (Harita içi)
    bots.forEach(b => {
        let margin = 150;
        if(b.x < margin || b.x > WORLD_SIZE-margin || b.y < margin || b.y > WORLD_SIZE-margin) {
            b.angle += 0.3;
        }
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.segments.unshift({x: b.x, y: b.y});
        if(b.segments.length > b.length * 3) b.segments.pop();
    });

    // Yemek toplama ve Çarpışma
    foods.forEach((f, i) => {
        if(Math.hypot(snake.x - f.x, snake.y - f.y) < 25) {
            foods.splice(i, 1); score += 10; snake.length += 0.5; spawnFood();
        }
    });
}

function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Izgara Arka Plan (Grid)
    ctx.strokeStyle = "#111";
    for(let x=0; x<WORLD_SIZE; x+=100) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); ctx.stroke();
    }
    for(let y=0; y<WORLD_SIZE; y+=100) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); ctx.stroke();
    }

    // Yemekler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill();
    });

    // Botlar
    bots.forEach(b => {
        b.segments.forEach(seg => {
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(seg.x, seg.y, 12, 0, Math.PI*2); ctx.fill();
        });
    });

    // Oyuncu
    snake.segments.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? "white" : activeColor;
        ctx.beginPath(); ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI*2); ctx.fill();
    });

    ctx.restore();
}

function gameOver() {
    gameRunning = false;
    let earnedPoints = (score / 100) * 75;
    points += earnedPoints;
    saveData();
    alert("Öldün! Kazanılan Puan: " + Math.floor(earnedPoints));
    location.reload();
}

// ADMİN PANELİ (Klavyeden 'P' tuşu)
window.addScoreAdmin = () => { score += 5000; snake.length += 50; };
window.killAllBots = () => { bots = []; alert("Temizlendi!"); };
window.closeAdmin = () => { document.getElementById('adminPanel').style.display = 'none'; };

function loop() { update(); draw(); requestAnimationFrame(loop); }
window.startGame = () => {
    if(!document.getElementById('pName').value) return alert("İsim yaz!");
    playerName = document.getElementById('pName').value;
    document.getElementById('menu').style.display = 'none';
    gameRunning = true;
};

init(); loop();

