const btn = document.getElementById("btn");
const texto = document.getElementById("texto");
const musica = document.getElementById("musica");
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let confetti = [];
let running = false;

function crearConfeti() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * 10 + 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        tilt: Math.random() * 10 - 5
    };
}

function iniciarConfeti() {
    for (let i = 0; i < 200; i++) {
        confetti.push(crearConfeti());
    }
    running = true;
    animar();
}

function animar() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach((c, i) => {
        ctx.beginPath();
        ctx.fillStyle = c.color;
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        c.y += c.d;
        c.x += Math.sin(c.tilt);
        if (c.y > canvas.height) confetti[i] = crearConfeti();
    });
    requestAnimationFrame(animar);
}

btn.addEventListener("click", () => {
    document.body.style.background = "#0f5cff";
    btn.style.display = "none";
    texto.style.display = "block";
    musica.play();
    iniciarConfeti();
});
