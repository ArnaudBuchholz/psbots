import { BALL_RADIUS, BOARD_HEIGHT, BOARD_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH } from './constants.js';

export type Paddle = {
  y: number;
  dy: number;
  score: number;
  running: boolean;
};

export type Ball = {
  x: number;
  dx: number;
  y: number;
  dy: number;
};

export type Particle = {
  id: number;
  x: number;
  dx: number;
  y: number;
  dy: number;
  frames: number;
  className: string;
  content?: string;
};

export class State {
  private _paddles: [Paddle, Paddle] = [
    { y: 0, dy: 0, score: 0, running: false },
    { y: 0, dy: 0, score: 0, running: false }
  ];
  get paddles() {
    return this._paddles;
  }

  private _ball: Ball = {
    x: 0,
    dx: 0,
    y: 0,
    dy: 0
  };
  get ball() {
    return this._ball;
  }

  private _lastParticleId = 0;
  private _particles: Particle[] = [];
  get particles(): readonly Particle[] {
    return this._particles;
  }
  addParticle(particle: Omit<Particle, 'id'>) {
    this._particles.push({ ...particle, id: this._lastParticleId++ });
  }

  resetPositions() {
    for (const paddle of this.paddles) {
      paddle.y = Math.floor((BOARD_HEIGHT - PADDLE_HEIGHT) / 2);
      paddle.dy = 0;
    }
    const { ball } = this;
    ball.x = Math.floor(BOARD_WIDTH / 2) - BALL_RADIUS;
    ball.dx = 0;
    ball.y = Math.floor(BOARD_HEIGHT / 2) - BALL_RADIUS;
    ball.dy = 0;
  }

  reset() {
    this._lastParticleId = 0;
    this.resetPositions();
    for (const paddle of this.paddles) {
      paddle.score = 0;
      paddle.running = true;
    }
    this._particles = [];
  }

  private _runPaddles() {
    for (const paddle of this._paddles) {
      let { y, dy } = paddle;
      y += dy;
      if (dy > 0) {
        if (y > BOARD_HEIGHT - PADDLE_HEIGHT) {
          y = 2 * (BOARD_HEIGHT - PADDLE_HEIGHT) - y;
          dy = -dy;
        }
      } else if (y < 0) {
        y = -y;
        dy = -dy;
      }
      paddle.y = y;
      paddle.dy = dy;
    }
  }

  private _runBall() {
    let { x, dx, y, dy } = this._ball;
    x += dx;
    y += dy;
    if (
      x > BOARD_WIDTH - BALL_RADIUS - PADDLE_WIDTH &&
      y > this._paddles[1].y &&
      y < this._paddles[1].y + PADDLE_HEIGHT
    ) {
      dx = -dx;
      x = 2 * (BOARD_WIDTH - BALL_RADIUS - PADDLE_WIDTH) - x;
    } else if (x > BOARD_WIDTH - BALL_RADIUS) {
      ++this._paddles[0].score;
      dx = -dx;
      x = 2 * (BOARD_WIDTH - BALL_RADIUS) - x;
    } else if (x < BALL_RADIUS + PADDLE_WIDTH && y > this._paddles[0].y && y < this._paddles[0].y + PADDLE_HEIGHT) {
      dx = -dx;
      x = 2 * (BALL_RADIUS + PADDLE_WIDTH) - x;
    } else if (x < BALL_RADIUS) {
      ++this._paddles[1].score;
      dx = -dx;
      x = 2 * BALL_RADIUS - x;
    }
    if (y > BOARD_HEIGHT - BALL_RADIUS) {
      dy = -dy;
      y = 2 * (BOARD_HEIGHT - BALL_RADIUS) - y;
    } else if (y < BALL_RADIUS) {
      dy = -dy;
      y = 2 * BALL_RADIUS - y;
    }
    this._ball = { x, dx, y, dy };
  }

  private _runParticles() {
    let cleanParticles = false;
    for (const particle of this._particles) {
      particle.x += particle.dx;
      particle.y += particle.dy;
      cleanParticles = cleanParticles || 0 > --particle.frames;
    }
    if (cleanParticles) {
      this._particles = this._particles.filter(({ frames }) => frames > 0);
    }
  }

  run() {
    this._runPaddles();
    this._runBall();
    this._runParticles();
  }

  constructor() {
    this.reset();
  }
}
