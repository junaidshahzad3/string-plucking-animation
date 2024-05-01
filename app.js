class App {
  constructor() {
    this.canvas = document.getElementById("pluck-canvas");
    this.canvas.style.height = "600px";
    this.canvas.style.width = "600px";
    this.ctx = this.canvas.getContext("2d");
    this.pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;
    this.strings = [];
    this.isDown = false;
    window.addEventListener("resize", this.resize.bind(this), false);
    this.resize();
    this.ball = new Ball(this.stageWidth, this.stageHeight, 10, 0);
    this.canvas.addEventListener("pointerdown", this.onDown.bind(this), false);
    this.canvas.addEventListener("pointermove", this.onMove.bind(this), false);
    this.canvas.addEventListener("pointerup", this.onUp.bind(this), false);
    window.requestAnimationFrame(this.animate.bind(this));
  }
  resize() {
    this.stageWidth = this.canvas.clientWidth;
    this.stageHeight = this.canvas.clientHeight;
    this.canvas.width = this.stageWidth * this.pixelRatio;
    this.canvas.height = this.stageHeight * this.pixelRatio;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);

    const yGap = 0;
    const xGap = 10;

    let y1 = yGap;
    let y2 = y1 + 300; // Initial width
    let increment = 20; // Change incrementally
    let incrementing = true; // Determine if increasing or decreasing

    const total = Math.floor((this.stageHeight - xGap) / xGap);
    this.strings = [];

    for (let i = 0; i < total; i++) {
      // Determine if should increment or decrement
      // this is to make "W" like shape. Remove if you don't need it
      if (incrementing) {
        y1 += increment;
        y2 += increment;
        if (y2 >= 600) {
          incrementing = false; // Start decrementing
        }
      } else {
        y1 -= increment;
        y2 -= increment;
        if (y1 <= 1) {
          incrementing = true; // Start incrementing
        }
      }

      this.strings[i] = new VerticalBounceString(
        {
          y1: y1,
          x1: i * xGap + xGap,
          y2: y2,
          x2: i * xGap + xGap,
        },
        "black"
      );
    }
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
    if (this.strings.length > 0) {
      for (let i = 0; i < this.strings.length; i++) {
        this.strings[i].animate(this.ctx, this.ball.x, this.ball.y);
      }
    }
    this.ball.animate(this.ctx, this.stageWidth, this.stageHeight);
  }
  onDown(e) {}
  onMove(e) {
    // Ball moves where the cursor is
    this.ball.x = e.clientX;
    this.ball.y = e.clientY;
  }
  onUp(e) {}
}
window.onload = () => {
  new App();
};

const BOUNCE = 0.92;

class VerticalBounceString {
  constructor(pos, color) {
    const middleX = pos.x1;
    const middleY = (pos.y2 - pos.y1) / 2 + pos.y1;

    this.points = [
      {
        x: pos.x1,
        y: pos.y1,
        ox: pos.x1,
        oy: pos.y1,
        vx: 0,
        vy: 0,
      },
      {
        x: middleX,
        y: middleY,
        ox: middleX,
        oy: middleY,
        vx: 0,
        vy: 0,
      },
      {
        x: pos.x2,
        y: pos.y2,
        ox: pos.x2,
        oy: pos.y2,
        vx: 0,
        vy: 0,
      },
    ];

    this.detect = 50;
    this.color = color;
  }

  animate(ctx, moveX, moveY) {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;

    if (
      lineCircle(
        this.points[0].x,
        this.points[0].y,
        this.points[2].x,
        this.points[2].y,
        moveX,
        moveY,
        this.detect
      )
    ) {
      this.detect = 50; // chipakny ka size
      let ty = (this.points[1].oy + moveY) / 2;
      let tx = moveX;
      this.points[1].vx = tx - this.points[1].x;
      this.points[1].vy = ty - this.points[1].y;
    } else {
      this.detect = 50;
      let tx = this.points[1].ox;
      let ty = this.points[1].oy;
      this.points[1].vx += tx - this.points[1].x;
      this.points[1].vx *= BOUNCE;
      this.points[1].vy += ty - this.points[1].y;
      this.points[1].vy *= BOUNCE;
    }

    this.points[1].x += this.points[1].vx;
    this.points[1].y += this.points[1].vy;

    let prevX = this.points[0].x;
    let prevY = this.points[0].y;

    ctx.moveTo(prevX, prevY);

    for (let i = 1; i < this.points.length; i++) {
      const cx = (prevX + this.points[i].x) / 2;
      const cy = (prevY + this.points[i].y) / 2;
      ctx.quadraticCurveTo(prevX, prevY, cx, cy);
      prevX = this.points[i].x;
      prevY = this.points[i].y;
    }

    ctx.lineTo(prevX, prevY);
    ctx.stroke();
  }
}

function distance(x1, y1, x2, y2) {
  const x = x2 - x1;
  const y = y2 - y1;
  return Math.sqrt(x * x + y * y);
}
function lineCircle(x1, y1, x2, y2, cx, cy, r) {
  const lineLength = distance(x1, y1, x2, y2);
  const point =
    ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / Math.pow(lineLength, 2);
  const px = x1 + point * (x2 - x1);
  const py = y1 + point * (y2 - y1);
  if (distance(px, py, cx, cy) < r) {
    return true;
  } else {
    return false;
  }
}
const PI2 = Math.PI * 2;
class Ball {
  constructor(stageWidth, stageHeight, radius) {
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.x = stageWidth / 2;
    this.y = stageHeight / 2;
  }
  animate(ctx) {
    ctx.fillStyle = "blue"; // Ball color
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
