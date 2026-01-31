const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ekran boyutunu ayarla
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let snake = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    segments: [],
    length: 5,
    angle: 0,
    speed: 3
};

// Dokunmatik Kontrol
window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - snake.x;
    const dy = touch.clientY - snake.y;
    snake.angle = Math.atan2(dy, dx);
}, { passive: false });

function update() {
    // Kafayı hareket ettir
    snake.x += Math.cos(snake.angle) * snake.speed;
    snake.y += Math.sin(snake.angle) * snake.speed;

    // Vücut takibi
    snake.segments.unshift({x: snake.x, y: snake.y});
    if (snake.segments.length > snake.length * 5) {
        snake.segments.pop();
    }
}

function draw() {
    ctx.fillStyle = 'black'; // Senin favori siyah arka planın
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Yılanın vücudunu çiz
    ctx.fillStyle = '#A020F0'; // Purpleguy'a yakışır mor bir yılan
    snake.segments.forEach((seg, index) => {
        if (index % 5 === 0) {
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, snake.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
