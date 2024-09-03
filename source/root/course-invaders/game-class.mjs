import { Player } from './player-class.mjs';
import { Alien } from './alien-class.mjs';
import { Bullet } from './bullet-class.mjs';

export class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(this.canvas);
        this.aliens = [];
        this.bullets = [];
        this.isGameOver = false;
        this.initialize();
    }

    initialize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.setupAliens();
        this.setupEventListeners();
        this.gameLoop();
    }

    setupAliens() {
        const alienWidth = 40;
        const alienHeight = 30;
        const rows = 6;
        const cols = 5;
        // array of 30 strings "class + number"
        // class is one of SOCIOL, ENGLISH, HISTORY, CRIM, ART HIST, COMMS
        // and number is 100-399 inclusive
        const alienText = Array.from({ length: 30 }, (_, i) => {
            const classes = ['SOCIOL', 'ENGLISH', 'HISTORY', 'CRIM', 'ART HIST', 'COMMS'];
            const number = Math.floor(Math.random() * 300) + 100;
            return `${classes[i % classes.length]}\n${number}`;
        });

        for (let row = 0; row < rows; row++) {
            this.aliens[row] = [];
            for (let col = 0; col < cols; col++) {
                this.aliens[row][col] = new Alien(
                    col * (alienWidth + 20) + 30,
                    row * (alienHeight + 20) + 30,
                    alienWidth,
                    alienHeight,
                    alienText[(row * cols + col) % alienText.length]
                );
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
            this.player.updatePosition(this.canvas.width);
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft') {
                this.player.isMovingLeft = true;
                // this.player.move(-1);
            } else if (e.code === 'ArrowRight') {
                this.player.isMovingRight = true;
                // this.player.move(1);
            } else if (e.code === 'Space') {
                this.shoot();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft') {
                this.player.isMovingLeft = false;
            } else if (e.code === 'ArrowRight') {
                this.player.isMovingRight = false;
            }
        })

        // Mobile controls
        let touchStartX = 0;
        let touchEndX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
            if (e.changedTouches[0].clientY > window.innerHeight / 2) {
                this.shoot();
            }
            if (e.changedTouches[0].clientY < window.innerHeight / 2) {
                if (e.changedTouches[0].clientX < window.innerWidth / 2) {
                    this.player.isMovingLeft = true;
                }
                if (e.changedTouches[0].clientX > window.innerWidth / 2) {
                    this.player.isMovingRight = true;
                }
            }
        });

        document.addEventListener('touchend', (e) => {
            this.player.isMovingLeft = false;
            this.player.isMovingRight = false;
        });

        document.addEventListener('touchend', (e) => {
            if (e.changedTouches[0].clientY < window.innerHeight / 2) {
                this.shoot();
            }
        });
    }

    shoot() {
        this.bullets.push(new Bullet(this.player.x + this.player.width / 2 - Bullet.WIDTH / 2, this.player.y));
    }

    update() {
        if (this.isGameOver) return;

        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.y + Bullet.HEIGHT < 0) {
                this.bullets.splice(index, 1);
            }
        });

        this.aliens.forEach(row => {
            row.forEach(alien => alien.update());
        });

        this.player.updateMovements();

        this.checkCollisions();
    }

    checkCollisions() {
        this.bullets.forEach((bullet, bIndex) => {
            this.aliens.forEach((row, rIndex) => {
                row.forEach((alien, aIndex) => {
                    if (bullet.collidesWith(alien)) {
                        this.aliens[rIndex].splice(aIndex, 1);
                        this.bullets.splice(bIndex, 1);
                    }
                });
            });
        });

        // Check game over
        if (this.aliens.length === 0 || this.aliens.some(row => row.some(alien => alien.y > this.canvas.height - 100))) {
            this.isGameOver = true;
        }
    }

    draw() {
        this.player.y = this.canvas.height - 60;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // space background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // stars
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            let x = Math.sin(i ** 2 / 1.5)
            let y = Math.cos(i ** 2 / 1.5)
            this.ctx.fillRect(this.canvas.width / 2 + x * i * 10, this.canvas.height / 2 + y * i * 10, 1, 1);
        }

        // draw instructions
        const instructions = 'Use arrow keys to move and space to shoot,\nor touch the sides of the screen to move and shoot';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        instructions.split('\n').forEach((line, i) => {
            this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height - 100 + i * 30);
        });

        this.player.draw(this.ctx);
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.aliens.forEach(row => row.forEach(alien => alien.draw(this.ctx)));

        if (this.aliens.flat().length === 0) {
            this.isGameOver = true;
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Win!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '15px Arial';
            this.ctx.fillText('Students have been saved from all that choice', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        if (this.aliens.some(row => row.some(alien => alien.y > this.canvas.height - 100))) {
            this.isGameOver = true;
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over.', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '15px Arial';
            this.ctx.fillText(' You didn\'t cut enough courses and the students are educated in subjects they love.', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }

    gameLoop() {
        if (this.isGameOver) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}
