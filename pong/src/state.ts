import { BALL_RADIUS, BOARD_HEIGHT, BOARD_WIDTH, PADDLE_HEIGHT } from './constants';

export type Paddle = {
  y: number;
  dy: number;
  score: number;
};

export const paddles: [Paddle, Paddle] = [
  { y: 0, dy: 0, score: 0 },
  { y: 0, dy: 0, score: 0 },
]

export type Ball = {
  x: number;
  dx: number;
  y: number;
  dy: number;
}

export const ball: Ball = {
  x: 0,
  dx: 0,
  y: 0,
  dy: 0
}

export const resetPositions = () => {
  for (let i = 0; i < paddles.length; ++i) {
    paddles[i].y = Math.floor((BOARD_HEIGHT - PADDLE_HEIGHT) / 2);
    paddles[i].dy = 0;
  }
  ball.x = Math.floor(BOARD_WIDTH / 2) - BALL_RADIUS;
  ball.dx = 0;
  ball.y = Math.floor(BOARD_HEIGHT / 2) - BALL_RADIUS;
  ball.dy = 0;
};
    
export const reset = () => {
  resetPositions();
  paddles[0].score = 0;
  paddles[1].score = 0;
};
  
reset();
