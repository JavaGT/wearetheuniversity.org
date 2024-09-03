export class Alien {
    constructor(x, y, width, height, text) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.speed = 1;
    }

    update() {
        this.x += this.speed;
        if (this.x + this.width > window.innerWidth || this.x < 0) {
            this.speed = -this.speed;
            this.y += this.height;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        // split at new line
        // ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2 + 7);
        let lines = this.text.split('\n');
        lines.forEach((line, index) => {
            ctx.fillText(line, this.x + this.width / 2, this.y + this.height / 2 + 7 + index * 12);
        });
    }
}
