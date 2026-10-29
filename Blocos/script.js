const canvas = document.getElementById("blocos");
const ctx = canvas.getContext("2d");

/**
 * Breakout Bits — colisão bola/raquete/tijolos.
 * Conceitos: vetor velocidade, reflexão, grid de tijolos, níveis, tijolos blindados e especiais.
 */

// Passo 1 — Mundo contínuo
const paddle = { w: 86, h: 12, x: 197, y: 530, speed: 420 };
const ball = { x: 240, y: 500, r: 7, vx: 180, vy: -240, launched: false };
let bricks = [];
let score = 0;
let lives = 3;
let running = false;
const keys = {};

// Passo 2 — Construir os tijolos (com blindados e blocos aleatórios de pontuação extra)
function buildBricks() {
    bricks = [];
    const colors = ["#581c87", "#7e22ce", "#e11d48", "#f97316", "#f59e0b"];
    const damagedColor = "#c084fc"; 
    const bonusColor = "#fef08a"; // Cor especial vibrante para blocos bônus

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            // A primeira linha (row === 0) é composta por tijolos blindados (2 HP)
            const isArmored = row === 0;
            const hp = isArmored ? 2 : 1;

            // Define aleatoriamente se um tijolo comum é um "Bloco Bônus" (15% de chance)
            // Blocos blindados não entram no sorteio bônus para manter a regra clara
            const isBonus = !isArmored && Math.random() < 0.15;

            bricks.push({
                x: 16 + col * 58,
                y: 40 + row * 28,
                w: 52,
                h: 20,
                color: isBonus ? bonusColor : colors[row],
                damagedColor: damagedColor,
                hp: hp,
                maxHp: hp,
                isBonus: isBonus,
                alive: true,
            });
        }
    }
}

/* Passo 3 — Controle da raquete: teclado (setas / A D) */
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.code === "Space") {
        e.preventDefault();
        running = true;
        ball.launched = true;
    }
    if (e.key.toLowerCase() === "r") reset();
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

/* e mouse sobre o canvas */
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.w / 2;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));
});

function resetBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - 14;
    ball.vx = 180 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -340;
    ball.launched = false;
}

function reset() {
    score = 0;
    lives = 3;
    running = false;
    buildBricks();
    resetBall();
}

// Passo 7 — Colisão com tijolo
function collideBrick(b) {
    return (
        ball.x + ball.r > b.x &&
        ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y &&
        ball.y - ball.r < b.y + b.h
    );
}

function update(dt) {
    if (keys["arrowleft"] || keys["a"]) paddle.x -= paddle.speed * dt;
    if (keys["arrowright"] || keys["d"]) paddle.x += paddle.speed * dt;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));

    /* Passo 4 — Lançar a bola */
    if (!ball.launched) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - 14;
        return; // não integra física ainda
    }
    if (!running) return;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Colisão com as paredes laterais
    if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx *= -1;
    } else if (ball.x + ball.r > canvas.width) {
        ball.x = canvas.width - ball.r;
        ball.vx *= -1;
    }

    // Colisão com o teto
    if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy *= -1;
    }

    // Perda de vida ao cair na parte inferior
    if (ball.y > canvas.height) {
        lives -= 1;
        if (lives <= 0) {
            running = false;
            return;
        }
        resetBall();
    }

    /* Passo 6 — Quicar na raquete com ângulo */
    if (
        ball.y + ball.r >= paddle.y &&
        ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.vy > 0 // só quando a bola ESTÁ DESCENDO
    ) {
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hit * 260;
        ball.vy = -Math.abs(ball.vy); // garante que sobe
    }

    /* Passo 7 — Colisão com tijolo */
    for (let b of bricks) {
        if (b.alive && collideBrick(b)) {
            ball.vy *= -1; 
            b.hp -= 1;     

            if (b.hp <= 0) {
                b.alive = false;
                // Pontuação customizada: Bônus vale 30 pts, blindados valem mais por HP, normais 10 pts
                if (b.isBonus) {
                    score += 30;
                } else {
                    score += 10 * b.maxHp; 
                }
            } else {
                score += 5; // Dano em blindado
            }
            break; 
        }
    }

    // Verifica se todos os tijolos foram destruídos
    if (bricks.every((b) => !b.alive)) {
        buildBricks();
        resetBall();
    }
}

// Passo 8 — Desenhando os elementos
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Raquete
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // Bola
    ctx.beginPath();
    ctx.fillStyle = "#fff7ed";
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Tijolos
    bricks.forEach((b) => {
        if (!b.alive) return;
        
        // Define a cor dependendo se está danificado ou se é bônus
        ctx.fillStyle = (b.hp < b.maxHp) ? b.damagedColor : b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Borda visual extra para identificar tijolos blindados intactos
        if (b.maxHp > 1 && b.hp === b.maxHp) {
            ctx.strokeStyle = "#e9d5ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
        }

        // Detalhe visual para blocos bônus (um brilho interno)
        if (b.isBonus) {
            ctx.strokeStyle = "#fde047";
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
        }
    });

    // Placar e Interface
    ctx.fillStyle = "#ffedd5";
    ctx.font = "16px Arial";
    ctx.fillText("Pontos: " + score + "    Vidas: " + lives, 16, 24);

    if (!running && lives > 0) {
        ctx.textAlign = "center";
        ctx.fillText("Pressione ESPAÇO para lançar", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "left";
    }

    if (lives <= 0) {
        ctx.textAlign = "center";
        ctx.font = "bold 28px Arial";
        ctx.fillText("GAME OVER — Aperte R para reiniciar", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = "left";
    }
}

let last = 0;
function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

// Inicializa o jogo e roda o loop principal
reset();
requestAnimationFrame(loop);