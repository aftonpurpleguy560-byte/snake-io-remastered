const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Ekran Boyutu Ayarı
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Oyun Değişkenleri
let score = 0;
let foods = [];
let snake = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    segments: [],
    length: 5,
    angle: 0,
    speed: 3,
    color: '#A020F0' // Purpleguy Moru
};

// Dokunmatik Kontrol (Tablet Uyumluluğu)
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - snake.x;
    const dy = touch.clientY - snake.y;
    snake.angle = Math.atan2(dy, dx);
}, { passive: false });

// Fare Kontrolü (Bilgisayarda test için)
window.addEventListener('mousemove', (e) => {
    const dx = e.clientX - snake.x;
    const dy = e.clientY - snake.y;
    snake.angle = Math.atan2(dy, dx);
});

// Yemek Oluşturma
function createFood() {
    if (foods.length < 30) {
        foods.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 6,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

// Çarpışma ve Güncelleme
function update() {
    // Kafayı ilerlet
    snake.x += Math.cos(snake.angle) * snake.speed;
    snake.y += Math.sin(snake.angle) * snake.speed;

    // Vücut takibi (Akıcı hareket)
    snake.segments.unshift({x: snake.x, y: snake.y});
    if (snake.segments.length > snake.length * 5) {
        snake.segments.pop();
    }

    // Yemek yeme kontrolü
    foods.forEach((food, index) => {
        const dx = snake.x - food.x;
        const dy = snake.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < snake.radius + food.radius) {
            foods.splice(index, 1);
            snake.length += 1;
            score += 10;
            scoreElement.innerText = "Skor: " + score;
        }
    });

    // Kenarlardan geçiş (Tablet için kolaylık)
    if (snake.x > canvas.width) snake.x = 0;
    if (snake.x < 0) snake.x = canvas.width;
    if (snake.y > canvas.height) snake.y = 0;
    if (snake.y < 0) snake.y = canvas.height;

    createFood();
}

// Çizim
function draw() {
    ctx.fillStyle = 'black'; // Efe'nin siyah arka planı
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yemekleri çiz
    foods.forEach(food => {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Yılanı çiz
    snake.segments.forEach((seg, index) => {
        if (index % 5 === 0) {
            ctx.fillStyle = snake.color;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI * 2);
            ctx.fill();
            // Göz ekleyelim (Sadece kafaya)
            if (index === 0) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

