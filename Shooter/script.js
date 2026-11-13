const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pontosElement = document.getElementById('pontos');
const vidasElement = document.getElementById('vidas');
const ondasElement = document.getElementById('ondas');

const KEYS = {};

let player, bullets, enemies, pontos, vidas, ondas, lastTime, gameOver, pausa, spawnTimer;

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    KEYS[key] = true;
    
    if ([" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) {
        e.preventDefault();
    }
    if (key === "p" && !gameOver) pausa = !pausa;
    if (key === "r" && gameOver) startGame();
});

window.addEventListener('keyup', (e) => {
    KEYS[e.key.toLowerCase()] = false;
});

function aabb(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

class Player {
    constructor() {
        this.width = 34;
        this.height = 44; // Mais vertical, formato de foguete
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 24;
        this.speed = 280;
        this.cooldown = 0;
    }

    update(dt) {
        const left = KEYS['arrowleft'] || KEYS['a'];
        const right = KEYS['arrowright'] || KEYS['d'];

        if (left) this.x -= this.speed * dt;
        if (right) this.x += this.speed * dt;
        
        this.x = Math.max(8, Math.min(canvas.width - this.width - 8, this.x));
        this.cooldown = Math.max(0, this.cooldown - dt);

        if ((KEYS[' '] || KEYS['arrowup'] || KEYS['w']) && this.cooldown === 0) {
            // Tiro duplo futurístico saindo das asas do foguete
            bullets.push(new Bullet(this.x + 4, this.y));
            bullets.push(new Bullet(this.x + this.width - 10, this.y));
            this.cooldown = 0.25;
        }
    }

    draw() {
        ctx.save();
        
        // Efeito de brilho (Neon Glow) Ciano/Azul
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00f0ff";

        // Corpo principal do Foguete
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y); // Ponta do foguete
        ctx.lineTo(this.x + this.width, this.y + this.height - 10);
        ctx.lineTo(this.x + this.width - 6, this.y + this.height);
        ctx.lineTo(this.x + 6, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height - 10);
        ctx.closePath();
        ctx.fill();

        // Asas laterais em tom Magenta Cyberpunk
        ctx.fillStyle = "#ff007f";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 20);
        ctx.lineTo(this.x - 8, this.y + this.height);
        ctx.lineTo(this.x + 6, this.y + this.height - 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + 20);
        ctx.lineTo(this.x + this.width + 8, this.y + this.height);
        ctx.lineTo(this.x + this.width - 6, this.y + this.height - 4);
        ctx.closePath();
        ctx.fill();

        // Cabine (Janela) brilhante
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 18, 5, 0, Math.PI * 2);
        ctx.fill();

        // Propulsor inferior (Chama pulsante)
        ctx.fillStyle = "#ff5500";
        ctx.shadowColor = "#ff5500";
        ctx.fillRect(this.x + 10, this.y + this.height, this.width - 20, 8 + Math.random() * 6);

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 14;
        this.speed = 500;
        this.dead = false;
    }

    update(dt) {
        this.y -= this.speed * dt;
        if (this.y + this.height < 0) this.dead = true;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.fillStyle = "#00f0ff"; // Projéteis de plasma em ciano
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = speed;
        this.dead = false;
    }

    update(dt) {
        this.y += this.speed * dt;
        if (this.y > canvas.height) {
            this.dead = true;
            vidas--;
            if (vidas <= 0) {
                vidas = 0;
                gameOver = true;
            }
            syncHud();
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0055"; // Inimigos com brilho magenta/vermelho sci-fi

        // Estrutura do drone inimigo
        ctx.fillStyle = "#1e1b4b";
        ctx.strokeStyle = "#ff0055";
        ctx.lineWidth = 2;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Núcleo do inimigo
        ctx.fillStyle = "#ff0055";
        ctx.fillRect(this.x + 8, this.y + 8, 14, 14);
        
        ctx.restore();
    }
}

function startGame() {
    player = new Player();
    bullets = [];
    enemies = [];
    pontos = 0;
    vidas = 5;
    ondas = 1;
    spawnTimer = 0;
    lastTime = 0;
    gameOver = false;
    pausa = false;
    syncHud();
}

function syncHud() {
    if (pontosElement) pontosElement.textContent = pontos;
    if (vidasElement) vidasElement.textContent = vidas;
    if (ondasElement) ondasElement.textContent = ondas;
}

function spawnWave(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        const count = 2 + ondas;

        for (let i = 0; i < count; i++) {
            const x = 20 + Math.random() * (canvas.width - 60);
            const speed = 45 + ondas * 12 + Math.random() * 30;
            enemies.push(new Enemy(x, -30 - i * 38, speed));
        }
        spawnTimer = Math.max(1.0, 2.8 - ondas * 0.15);
    }
}

function update(dt) {
    if (pausa || gameOver) return;

    player.update(dt);
    bullets.forEach(bullet => bullet.update(dt));
    enemies.forEach(enemy => enemy.update(dt));
    spawnWave(dt);

    bullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (!bullet.dead && !enemy.dead && aabb(bullet, enemy)) {
                bullet.dead = true;
                enemy.dead = true;
                pontos += 15;
                ondas = Math.floor(pontos / 150) + 1;
                syncHud();
            }
        });
    });

    enemies.forEach(enemy => {
        if (!enemy.dead && aabb(enemy, player)) {
            enemy.dead = true;
            vidas--;
            if (vidas <= 0) {
                vidas = 0;
                gameOver = true;
            }
            syncHud();
        }
    });

    bullets = bullets.filter(b => !b.dead);
    enemies = enemies.filter(e => !e.dead);
}

function draw() {
    // Fundo espacial profundo com tom azulado escuro (Cyberpunk space)
    ctx.fillStyle = "#050511";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fundo estrelado dinâmico com variações de brilho
    for (let i = 0; i < 50; i++) {
        const starX = (i * 73) % canvas.width;
        const starY = (i * 41) % canvas.height;
        ctx.fillStyle = (i % 3 === 0) ? "#00f0ff" : "#ffffff";
        ctx.fillRect(starX, starY, (i % 2 === 0) ? 2 : 1, (i % 2 === 0) ? 2 : 1);
    }

    player.draw();
    enemies.forEach(enemy => enemy.draw());
    bullets.forEach(bullet => bullet.draw());

    if (pausa) {
        drawOverlay("PAUSE", "Pressione P para continuar");
    }

    if (gameOver) {
        drawOverlay("GAME OVER", "Pressione R para reiniciar");
    }
}

function drawOverlay(text, sub) {
    ctx.fillStyle = "rgba(5, 5, 17, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00f0ff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00f0ff";
    ctx.font = "bold 32px 'Source Code Pro', monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 12);

    ctx.shadowBlur = 0;
    if (sub) {
        ctx.font = "16px 'Source Code Pro', monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 24);
    }
}

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(0.33, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

startGame();
requestAnimationFrame(loop);