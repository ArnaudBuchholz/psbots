import {
  BALL_RADIUS,
  BOARD_HEIGHT,
  BOARD_MIN_SCALE,
  BOARD_WIDTH,
  FPS_REFRESH,
  PADDLE_HEIGHT,
  PADDLE_WIDTH
} from './constants.js';
import type { Game } from './Game.js';

const BOARD_SCALED = { width: 0, height: 0 };
const PADDLE_SCALED = { width: 0, height: 0 };
const BALL_SCALED = { radius: 0 };

const missing = (cssSelector: string): never => {
  throw new Error(`Unable to find '${cssSelector}'`);
};
const $ = (cssSelector: string) => document.querySelector(cssSelector) ?? missing(cssSelector);

let paddles: [Element, Element];
let scores: [Element, Element];
let coords: [Element, Element, Element];
let codes: [Element, Element];
let board: Element;
let ball: Element;
let status: Element;

const resize = () => {
  const MARGINS = 50;
  const windowRatio = window.innerWidth / window.innerHeight;
  const boardRatio = BOARD_WIDTH / BOARD_HEIGHT;

  if (windowRatio > boardRatio) {
    BOARD_SCALED.height = Math.max(window.innerHeight - 2 * MARGINS, BOARD_HEIGHT / BOARD_MIN_SCALE);
    BOARD_SCALED.width = Math.floor(BOARD_SCALED.height * boardRatio);
  } else {
    BOARD_SCALED.width = Math.max(window.innerWidth - 2 * MARGINS, BOARD_WIDTH / BOARD_MIN_SCALE);
    BOARD_SCALED.height = Math.floor(BOARD_SCALED.width / boardRatio);
  }

  PADDLE_SCALED.width = Math.ceil((PADDLE_WIDTH * BOARD_SCALED.width) / BOARD_WIDTH);
  PADDLE_SCALED.height = Math.ceil((PADDLE_HEIGHT * BOARD_SCALED.height) / BOARD_HEIGHT);
  BALL_SCALED.radius = Math.ceil((BALL_RADIUS * BOARD_SCALED.height) / BOARD_HEIGHT);

  board.setAttribute('style', `width: ${BOARD_SCALED.width}px; height: ${BOARD_SCALED.height}px`);
};

let lastAnimationFrameRequest: ReturnType<typeof requestAnimationFrame> | undefined;
let lastTimestamp: number;
let lastFpsRefresh: number;

export const start = (game: Game) => {
  document.body.innerHTML = `
    <div class="status"></div>
    <div class="board">
      <div class="code player_1">This is an example source code</div>
      <div class="paddle player_1"></div>
      <div class="score player_1">0</div>
      <div class="coords player_1">0,0</div>
      <div class="code player_2">This is an example source code</div>
      <div class="paddle player_2"></div>
      <div class="score player_2">0</div>
      <div class="coords player_2">0,0</div>
      <div class="coords ball">0,0</div>
      <div class='sprite ball'>
        <div class="ball_effect"></div>
      </div>
    </div>
  `;
  paddles = [$('.paddle.player_1'), $('.paddle.player_2')];
  scores = [$('.score.player_1'), $('.player_2')];
  codes = [$('.code.player_1'), $('.code.player_2')];
  coords = [$('.coords.player_1'), $('.coords.player_2'), $('.coords.ball')];
  board = $('.board');
  ball = $('.sprite.ball');
  status = $('.status');
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  resize();

  lastTimestamp = 0;
  lastFpsRefresh = FPS_REFRESH;
  lastAnimationFrameRequest = requestAnimationFrame((timestamp) => {
    lastTimestamp = timestamp;
    lastAnimationFrameRequest = requestAnimationFrame(frame.bind(game));
  });
};

const frame = function (this: Game, timestamp: number) {
  const { state, speed } = this;

  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  const estimatedFps = Math.floor(1000 / elapsed);
  lastFpsRefresh -= elapsed;
  if (lastFpsRefresh <= 0) {
    status.innerHTML = `x${speed} fps: ${estimatedFps}/s`;
    lastFpsRefresh = FPS_REFRESH;
  }

  paddles[0].setAttribute(
    'style',
    `width: ${PADDLE_SCALED.width}px; height: ${PADDLE_SCALED.height}px; top: ${100 * (state.paddles[0].y / BOARD_HEIGHT)}%;`
  );
  scores[0].innerHTML = state.paddles[0].score.toString();
  codes[0].innerHTML = this.getEngineState(0);
  coords[0].innerHTML = `${state.paddles[0].y} ⇕${state.paddles[0].dy}`;
  paddles[1].setAttribute(
    'style',
    `width: ${PADDLE_SCALED.width}px; height: ${PADDLE_SCALED.height}px; left: calc(100% - ${PADDLE_SCALED.width}px); top: ${100 * (state.paddles[1].y / BOARD_HEIGHT)}%;`
  );
  scores[1].innerHTML = state.paddles[1].score.toString();
  codes[1].innerHTML = this.getEngineState(1);
  coords[1].innerHTML = `${state.paddles[1].y} ⇕${state.paddles[1].dy}`;
  ball.setAttribute(
    'style',
    `width: ${BALL_SCALED.radius * 2}px; height: ${BALL_SCALED.radius * 2}px; left: calc(${100 * (state.ball.x / BOARD_WIDTH)}% - ${BALL_SCALED.radius}px); top: calc(${100 * (state.ball.y / BOARD_HEIGHT)}% - ${BALL_SCALED.radius}px)`
  );
  coords[2].innerHTML = `${state.ball.x},${state.ball.y} ⇔${state.ball.dx}⇕${state.ball.dy}`;

  const particles = board.querySelectorAll('.particle');
  const particleById: { [key in string]: Element } = {};
  for (const particle of particles.values()) {
    particleById[particle.id] = particle;
  }
  const ids = [];
  for (const { id, x, y, className, content } of state.particles) {
    ids.push(id.toString());
    let particle = particleById[id];
    if (!particle) {
      particle = document.createElement('div');
      board.append(particle);
      particle.setAttribute('id', id.toString());
      particle.setAttribute('class', `particle ${className}`);
    }
    particle.setAttribute('style', `left: ${100 * (x / BOARD_WIDTH)}%; top: ${100 * (y / BOARD_HEIGHT)}%`);
    if (content) {
      particle.innerHTML = content;
    }
  }
  for (const particle of particles.values()) {
    const { id } = particle;
    if (!ids.includes(id)) {
      particle.remove();
    }
  }

  // Let the window refresh before processing
  setTimeout(() => {
    this.run(Math.ceil(elapsed / 4));
    lastAnimationFrameRequest = requestAnimationFrame(frame.bind(this));
  }, 0);
};

export const stop = () => {
  window.removeEventListener('resize', resize);
  window.removeEventListener('load', resize);
  if (lastAnimationFrameRequest !== undefined) {
    cancelAnimationFrame(lastAnimationFrameRequest);
  }
};
