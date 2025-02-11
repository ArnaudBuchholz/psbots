const BOARD_WIDTH = 3200
const BOARD_HEIGHT = 2000
const PADDLE_WIDTH = 50
const PADDLE_HEIGHT = 300
const BALL_RADIUS = 32

const paddles = [document.querySelector('.paddle_1'), document.querySelector('.paddle_2')]
const scores = [document.querySelector('.score_1'), document.querySelector('.score_2')]
const board = document.querySelector('.board')
const ball = document.querySelector('.ball')

const input = new URLSearchParams(location.search)
const inputBallDx = parseInt(input.get('ballx') ?? '1')
const inputBallDY = parseInt(input.get('bally') ?? '1')
const inputSpeed = parseInt(input.get('speed') ?? '1')
const MAX_POINTS = parseInt(input.get('points') ?? '3')

const state = {
  paddles: [
    { y: (BOARD_HEIGHT - PADDLE_HEIGHT) / 2, dy: 1, score: 0 },
    { y: BOARD_HEIGHT - PADDLE_HEIGHT, dy: -1, score: 0 },
  ],
  ball: {
    x: BOARD_WIDTH / 2 - BALL_RADIUS,
    dx: inputBallDx,
    y: BOARD_HEIGHT / 2 - BALL_RADIUS,
    dy: inputBallDY
  }
}

const BOARD_SCALED = { width: 0, height: 0 }
const PADDLE_SCALED = { width: 0, height: 0 }
const BALL_SCALED = { radius: 0 }

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

let speed = inputSpeed

document.addEventListener('keydown', (e) => {
  if (e.key === 'a') {
    state.paddles[0].dy = -state.paddles[0].dy
  } else if (e.key === 's') {
    state.paddles[1].dy = -state.paddles[1].dy
  } else if (e.key === 'ArrowLeft') {
    speed = Math.max(1, speed - 1)
  } else if (e.key === 'ArrowRight') {
    ++speed
  }
})

let lastTimestamp

const FPS_REFRESH = 500
const status = document.querySelector('.status')
let lastFpsRefresh = FPS_REFRESH
let lastFpsValue

const frame = (timestamp) => {
  if (!lastTimestamp) {
    lastTimestamp = timestamp
    requestAnimationFrame(frame)
    return
  }

  const elapsed = timestamp - lastTimestamp
  lastTimestamp = timestamp  

  const estimatedFps = Math.floor(1000 / elapsed)
  lastFpsRefresh -= elapsed
  if (lastFpsRefresh <= 0) {
    if (lastFpsValue !== estimatedFps) {
      status.innerHTML = `x${speed} fps: ${estimatedFps}/s`
      lastFpsValue = estimatedFps
    }
    lastFpsRefresh = FPS_REFRESH
  }

  let frames = Math.floor(elapsed * speed / 4)
  while (frames-- > 0) {

    for (const paddle of state.paddles) {
      let { y, dy } = paddle
      y += dy
      if (dy > 0) {
        if (y > BOARD_HEIGHT - PADDLE_HEIGHT) {
          y = 2 * (BOARD_HEIGHT - PADDLE_HEIGHT) - y
          dy = -dy
        }
      } else if (y < 0) {
        y = -y
        dy = -dy
      }
      paddle.y = y
      paddle.dy = dy
    }

    let { x, dx, y, dy } = state.ball
    x += dx
    y += dy

    if (x > BOARD_WIDTH - BALL_RADIUS - PADDLE_WIDTH &&
      y > state.paddles[1].y &&
      y < state.paddles[1].y + PADDLE_HEIGHT
    ) {
      dx = -dx
      x = 2 * (BOARD_WIDTH - BALL_RADIUS - PADDLE_WIDTH) - x
    } else if (x > BOARD_WIDTH - BALL_RADIUS) {
      ++state.paddles[0].score >= MAX_POINTS
      dx = -dx
      x = 2 * (BOARD_WIDTH - BALL_RADIUS) - x
    } else if (x < BALL_RADIUS + PADDLE_WIDTH &&
      y > state.paddles[0].y &&
      y < state.paddles[0].y + PADDLE_HEIGHT
    ) {
      dx = -dx
      x = 2 * (BALL_RADIUS + PADDLE_WIDTH) - x
    } else if (x < BALL_RADIUS) {
      ++state.paddles[1].score
      dx = -dx
      x = 2 * BALL_RADIUS - x
    }

    if (y > BOARD_HEIGHT - BALL_RADIUS) {
      dy = -dy
      y = 2 * (BOARD_HEIGHT - BALL_RADIUS) - y
    } else if (y < BALL_RADIUS) {
      dy = -dy
      y = 2 * BALL_RADIUS - y
    }
    state.ball = { x, dx, y, dy }

    if (state.paddles[0].score >= MAX_POINTS || state.paddles[1].score >= MAX_POINTS) {
      state.paddles[0].dy = 0
      state.paddles[1].dy = 0
      state.ball.dx = 0
      state.ball.dy = 0
    }
  }

  paddles[0].style.top = `${100 * (state.paddles[0].y / BOARD_HEIGHT)}%`
  scores[0].innerHTML = state.paddles[0].score
  paddles[1].style.top = `${100 * (state.paddles[1].y / BOARD_HEIGHT)}%`
  scores[1].innerHTML = state.paddles[1].score
  ball.style.left = `calc(${100 * (state.ball.x / BOARD_WIDTH)}% - ${BALL_SCALED.radius}px)`
  ball.style.top = `calc(${100 * (state.ball.y / BOARD_HEIGHT)}% - ${BALL_SCALED.radius}px)`

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)

