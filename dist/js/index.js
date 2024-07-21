"use strict";
const canvas = document.querySelector('canvas');
const ctx = canvas === null || canvas === void 0 ? void 0 : canvas.getContext('2d');
const score = document.querySelector('.score-value');
const finalScore = document.querySelector('.final-score > span');
const menu = document.querySelector('.menu-screen');
const buttonPlay = document.querySelector('.btn-play');
let direction, loopId, result = 0;
let audio = new Audio('/audio.mp3');
class Cobra {
    constructor(custom) {
        this.size = custom.size;
        this.vel = custom.speed;
        this.food = {
            x: this.randomPosition(),
            y: this.randomPosition(),
            color: this.randomColor()
        };
        this.cobra = [
            { x: 270, y: 240 },
            { x: 300, y: 240 }
        ]; // corpo da cobra
        console.log('Food initialized:', this.food); // Debugging log
    }
    // Quando comer a fruta incrementa +10
    incrementScore() {
        if (!score)
            return result;
        result = (parseInt(score.innerText) || 0) + 10;
        score.innerText = result.toString(); // para escrever é preciso transformar em uma string
        return result;
    }
    // Retorna um numero aleatorio
    randomNumber(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }
    randomPosition() {
        if (!canvas)
            return 0;
        const number = this.randomNumber(0, canvas.width - this.size);
        return Math.round(number / 30) * 30; // faz o numero aleatorio sempre ser um multiplo de 30
    }
    // Retorna uma cor aleatoria
    randomColor() {
        const red = this.randomNumber(0, 255);
        const green = this.randomNumber(0, 255);
        const blue = this.randomNumber(0, 255);
        return `rgb(${red}, ${green}, ${blue})`;
    }
    // Desenha a cobra passando pelo array this.cobra
    drawCobra() {
        if (!ctx)
            return;
        ctx.fillStyle = '#ddd';
        this.cobra.forEach((position, index) => {
            // Se for o ultimo elemento/cabeça pintar
            if (index === this.cobra.length - 1)
                ctx.fillStyle = 'white';
            ctx.fillRect(position.x, position.y, this.size, this.size); // fillRect recebe 4 parametros
        });
    }
    // Identifica a direção e move a cobra
    moveSnake() {
        if (!direction)
            return;
        // Pega o index do ultimo elemento de cobra/ cabeça
        const head = this.cobra[this.cobra.length - 1];
        // O head vai ser sempre o mais atualizado (add mais 30 na direção desejada cabeça atual)
        if (direction === 'right')
            this.cobra.push({ x: head.x + this.size, y: head.y });
        if (direction === 'left')
            this.cobra.push({ x: head.x - this.size, y: head.y });
        if (direction === 'up')
            this.cobra.push({ x: head.x, y: head.y - this.size });
        if (direction === 'down')
            this.cobra.push({ x: head.x, y: head.y + this.size });
        this.cobra.shift(); // Remove o primeiro elemento do array
    }
    // Desenhado o fundo 
    drawGrid() {
        if (!ctx || !canvas)
            return;
        // Faz um stroke/ linha
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#191919';
        for (let i = 30; i < canvas.width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 600); // Defini a onde acaba a posição do stroke
            ctx.stroke(); // Desenha
            // Agora desenhado verticalmente
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(600, i);
            ctx.stroke();
        }
    }
    // Limitando o movimento da cobra em direção contraria
    teclaDirection(e) {
        if (e === 'ArrowUp' && direction !== 'down')
            direction = 'up';
        if (e === 'ArrowDown' && direction !== 'up')
            direction = 'down';
        if (e === 'ArrowLeft' && direction !== 'right')
            direction = 'left';
        if (e === 'ArrowRight' && direction !== 'left')
            direction = 'right';
    }
    // Pega a cordenada da food e desenha ela
    drawFood() {
        if (!ctx)
            return;
        // Dessestruturando
        const { x, y, color } = this.food;
        console.log('Drawing food at:', x, y, 'with color:', color); // Debugging log
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.size, this.size);
        ctx.shadowBlur = 0; // Depois de desenhar o food tira o blur
    }
    // Verifica se o ultimo elemento tocou na food
    checkEat() {
        const head = this.cobra[this.cobra.length - 1];
        if (head.x === this.food.x && head.y === this.food.y) {
            this.incrementScore();
            this.cobra.push(Object.assign({}, head)); // Passando as cordenadas do proximo elemento do corpo da cobra ao comer o food
            audio.play();
            // Ao a head ter a mesma posição do food, redifini a posição e a cor do food
            let x = this.randomPosition();
            let y = this.randomPosition();
            while (this.cobra.find((position) => position.x === x && position.y === y)) { // Enquanto existir um position/snake == x/food
                x = this.randomPosition();
                y = this.randomPosition();
            }
            // Depois das verificações
            this.food.x = x;
            this.food.y = y;
            this.food.color = this.randomColor();
        }
    }
    // Verifica se não perdeu o game
    gameOver() {
        direction = undefined;
        if (!canvas || !finalScore || !menu)
            return;
        menu.style.display = 'flex';
        finalScore.innerHTML = result.toString();
        canvas.style.filter = 'blur(2px)';
    }
    // Checa a colisão
    checkCollision() {
        if (!canvas)
            return;
        const head = this.cobra[this.cobra.length - 1];
        const canvasLimit = canvas.width - this.size;
        const neckIndex = this.cobra.length - 2; // Pescoço da cobra, por ela estar grudada no pescoço ser uma exceção
        const wallCollision = head.x < 0 || head.x > canvasLimit || head.y < 0 || head.y > canvasLimit; // Verificação da parede
        const selfCollision = this.cobra.find((position, index) => {
            return index < neckIndex && position.x === head.x && position.y === head.y;
        });
        if (wallCollision || selfCollision) {
            this.gameOver();
        }
    }
    gameLoop() {
        if (!ctx)
            return;
        clearTimeout(loopId); // Stop loop para não passar de 300, assim que chega em 300 o loop começa e limpa na primeira linha
        ctx.clearRect(0, 0, 600, 600); // Limpando a tela antes de fazer o desenho (os parametros são o tamanho da tela) ele limpa os elementos do array que não existe mais
        this.drawGrid();
        this.drawFood();
        this.moveSnake();
        this.drawCobra();
        this.checkEat();
        this.checkCollision();
        loopId = setTimeout(() => {
            this.gameLoop();
        }, this.vel); // Velocidade do loop do game
    }
}
//===================================================== event =======================
let snake = new Cobra({ size: 30, speed: 100 });
snake.gameLoop();
document.addEventListener('keydown', ({ key }) => snake.teclaDirection(key));
