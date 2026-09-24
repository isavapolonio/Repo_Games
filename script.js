const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// x, y - Posicionar o objeto
// w, h - definir o tamanho do personagem
// vx - velocidade horizontal

const player = {
    x: 100,
    y: 100,
    w: 50,
    r: 50,
    vx: 50,
    vy: 50
};

let last = 0; // Marca a posição do último frame

function update(dt) {
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    // Atualiza a posição horizontal e vertical do player

    if (player.x + player.w > canvas.width || player.x < 0) {
        player.vx *= -1;}
    // Inverte a direção do player quando ele atinge as bordas do canvas

    if (player.y + player.r > canvas.height || player.y < 0) {
        player.vy *= -1;
    }
    // Bate no teto/chão e inverte a direção do player
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#30e742ff";
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.r / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffffff";
    ctx.fillText("O DeltaTime - dt independe da taxa de quadros", 10, 20);
}

function loop(ts) {
    if (!last) last = ts;
    let dt = Math.min(0.05, (ts - last) / 1000); 
    last = ts;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop); // executar primeiro disparo

// Eu uso o DeltaTime - dt para garantir que o movimento do player seja suave e independente da taxa de quadros.
