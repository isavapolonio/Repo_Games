const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// x, y - Posicionar o objeto
// w, h - definir o tamanho do personagem
// vx - velocidade horizontal

const player = {
    x: 100,
    y: 100,
    w: 50,
    h: 50,
    vx: 50
};

let last = 0; // Marca a posição do último frame

function update(dt) {
    player.x += player.vx * dt;
    // Se o player sair da tela, ele volta para o início
    if (player.x < 0 || player.x + player.w > canvas.width) {
        player.vx *= -1;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#30e742ff";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#ffffffff";
    ctx.fillRect(player.x + 10, player.y + 10, player.w - 20, player.h - 20);

    ctx.fillText("O DeltaTime - dt independe da taxa de quadros", 10, 20);
}

function loop(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000); 
    last = ts;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop); // executar primeiro disparo
