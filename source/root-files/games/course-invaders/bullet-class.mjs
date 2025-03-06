export class Bullet {
    static WIDTH = 5;
    static HEIGHT = 15;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    update() {
        this.y -= 7;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, Bullet.WIDTH, Bullet.HEIGHT);
    }

    collidesWith(alien) {
        return this.x < alien.x + alien.width &&
            this.x + Bullet.WIDTH > alien.x &&
            this.y < alien.y + alien.height &&
            this.y + Bullet.HEIGHT > alien.y;
    }
}
