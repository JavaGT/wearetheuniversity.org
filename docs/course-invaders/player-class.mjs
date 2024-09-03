export class Player {
    constructor(canvas) {
        this.x = canvas.width / 2;
        this.y = canvas.height - 60;
        this.width = 50;
        this.height = 50;
        this.speed = 5;
        this.sprite = '/player.webp'; // Replace with your custom URL
        this.img = new Image();
        this.img.src = this.sprite;

        let isMovingLeft = false;
        let isMovingRight = false;
    }

    updateMovements() {
        if (this.isMovingLeft) {
            this.move(-1);
        }
        if (this.isMovingRight) {
            this.move(1);
        }
    }

    move(direction) {
        this.x += direction * this.speed;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > window.innerWidth) this.x = window.innerWidth - this.width;
    }

    updatePosition(canvasWidth) {
        if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
        }
    }

    draw(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
}
