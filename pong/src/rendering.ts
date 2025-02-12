import { BALL_RADIUS, BOARD_HEIGHT, BOARD_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH } from './constants';

const BOARD_SCALED = { width: 0, height: 0 };
const PADDLE_SCALED = { width: 0, height: 0 };
const BALL_SCALED = { radius: 0 };

const missing = (cssSelector: string): never => { throw new Error(`Unable to find '${cssSelector}'`); };
const $ = (cssSelector: string) => document.querySelector('.paddle_1') ?? missing(cssSelector)

const paddles = [$('.paddle_1'), $('.paddle_2')];
const scores = [$('.score_1'), $('.score_2')];
const board =$('.board');
const ball = $('.ball');

const resize = () => {
  const MARGINS = 50;
  const windowRatio = window.innerWidth / window.innerHeight
  const boardRatio = BOARD_WIDTH / BOARD_HEIGHT

  if (windowRatio > boardRatio) {
    BOARD_SCALED.height = window.innerHeight - 2 * MARGINS
    BOARD_SCALED.width = BOARD_SCALED.height * boardRatio
  } else {
    BOARD_SCALED.width = window.innerWidth - 2 * MARGINS
    BOARD_SCALED.height = BOARD_SCALED.width / boardRatio
  }

  PADDLE_SCALED.width = Math.ceil(PADDLE_WIDTH * BOARD_SCALED.width / BOARD_WIDTH)
  PADDLE_SCALED.height = Math.ceil(PADDLE_HEIGHT * BOARD_SCALED.height / BOARD_HEIGHT)
  BALL_SCALED.radius = Math.ceil(BALL_RADIUS * BOARD_SCALED.height / BOARD_HEIGHT)

  board.setAttribute('style', `width: ${BOARD_SCALED.width}px; height: ${BOARD_SCALED.height}px`)
  paddles[0].setAttribute('style', `width: ${PADDLE_SCALED.width}px; height: ${PADDLE_SCALED.height}px`)
  paddles[1].setAttribute('style', `width: ${PADDLE_SCALED.width}px; height: ${PADDLE_SCALED.height}px; left: calc(100% - ${PADDLE_SCALED.width}px);`)
  ball.setAttribute('style', `width: ${BALL_SCALED.radius * 2}px; height: ${BALL_SCALED.radius * 2}px;`)
}

window.addEventListener('resize', resize)
window.addEventListener('load', resize)
