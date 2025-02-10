const BOARD_WIDTH = 3200
const BOARD_HEIGHT = 2000
const PADDLE_WIDTH = 50
const PADDLE_HEIGHT = 300
const BALL_RADIUS = 32

const paddles = [document.querySelector('.paddle_1'), document.querySelector('.paddle_2')]
const board = document.querySelector('.board')
const ball = document.querySelector('.ball')

const state = {
  paddles: [
    { y: (BOARD_HEIGHT - PADDLE_HEIGHT) / 2, dy: 1 },
    { y: BOARD_HEIGHT - PADDLE_HEIGHT, dy: -1 },
  ],
  ball: {
    x: BOARD_WIDTH / 2 - BALL_RADIUS,
    dx: 1,
    y: BOARD_HEIGHT / 2 - BALL_RADIUS,
    dy: 1
  }
}


// document.addEventListener('keydown', (e) => {
// if (e.key == 'Enter') {
//   gameState = gameState == 'start' ? 'play' : 'start';
//   if (gameState == 'play') {
//   message.innerHTML = 'Game Started';
//   message.style.left = 42 + 'vw';
//   requestAnimationFrame(() => {
//     dx = Math.floor(Math.random() * 4) + 3;
//     dy = Math.floor(Math.random() * 4) + 3;
//     dxd = Math.floor(Math.random() * 2);
//     dyd = Math.floor(Math.random() * 2);
//     moveBall(dx, dy, dxd, dyd);
//   });
//   }
// }
// if (gameState == 'play') {
//   if (e.key == 'w') {
//   paddle_1.style.top =
//     Math.max(
//     board_coord.top,
//     paddle_1_coord.top - window.innerHeight * 0.06
//     ) + 'px';
//   paddle_1_coord = paddle_1.getBoundingClientRect();
//   }
//   if (e.key == 's') {
//   paddle_1.style.top =
//     Math.min(
//     board_coord.bottom - paddle_common.height,
//     paddle_1_coord.top + window.innerHeight * 0.06
//     ) + 'px';
//   paddle_1_coord = paddle_1.getBoundingClientRect();
//   }

//   if (e.key == 'ArrowUp') {
//   paddle_2.style.top =
//     Math.max(
//     board_coord.top,
//     paddle_2_coord.top - window.innerHeight * 0.1
//     ) + 'px';
//   paddle_2_coord = paddle_2.getBoundingClientRect();
//   }
//   if (e.key == 'ArrowDown') {
//   paddle_2.style.top =
//     Math.min(
//     board_coord.bottom - paddle_common.height,
//     paddle_2_coord.top + window.innerHeight * 0.1
//     ) + 'px';
//   paddle_2_coord = paddle_2.getBoundingClientRect();
//   }
// }
// });

// function moveBall(dx, dy, dxd, dyd) {
// if (ball_coord.top <= board_coord.top) {
//   dyd = 1;
// }
// if (ball_coord.bottom >= board_coord.bottom) {
//   dyd = 0;
// }
// if (
//   ball_coord.left <= paddle_1_coord.right &&
//   ball_coord.top >= paddle_1_coord.top &&
//   ball_coord.bottom <= paddle_1_coord.bottom
// ) {
//   dxd = 1;
//   dx = Math.floor(Math.random() * 4) + 3;
//   dy = Math.floor(Math.random() * 4) + 3;
// }
// if (
//   ball_coord.right >= paddle_2_coord.left &&
//   ball_coord.top >= paddle_2_coord.top &&
//   ball_coord.bottom <= paddle_2_coord.bottom
// ) {
//   dxd = 0;
//   dx = Math.floor(Math.random() * 4) + 3;
//   dy = Math.floor(Math.random() * 4) + 3;
// }
// if (
//   ball_coord.left <= board_coord.left ||
//   ball_coord.right >= board_coord.right
// ) {
//   if (ball_coord.left <= board_coord.left) {
//   score_2.innerHTML = +score_2.innerHTML + 1;
//   } else {
//   score_1.innerHTML = +score_1.innerHTML + 1;
//   }
//   gameState = 'start';

//   ball_coord = initial_ball_coord;
//   ball.style = initial_ball.style;
//   message.innerHTML = 'Press Enter to Play Pong';
//   message.style.left = 38 + 'vw';
//   return;
// }
// ball.style.top = ball_coord.top + dy * (dyd == 0 ? -1 : 1) + 'px';
// ball.style.left = ball_coord.left + dx * (dxd == 0 ? -1 : 1) + 'px';
// ball_coord = ball.getBoundingClientRect();

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

let speed = 1

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    speed = Math.max(1, speed - 1)
  } else if (e.key === 'ArrowRight') {
    ++speed
  }
})

let lastTimestamp

const FPS_REFRESH = 500
const fps = document.querySelector('.fps')
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
      fps.innerHTML = estimatedFps
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
    if (x > BOARD_WIDTH - BALL_RADIUS) {
      // +1 to paddle left
      dx = -dx
      x = 2 *(BOARD_WIDTH - BALL_RADIUS) - x
    } else if (x < BALL_RADIUS) {
      // +1 to paddle right
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
  }

  paddles[0].style.top = `${100 * (state.paddles[0].y / BOARD_HEIGHT)}%`
  paddles[1].style.top = `${100 * (state.paddles[1].y / BOARD_HEIGHT)}%`
  ball.style.left = `calc(${100 * (state.ball.x / BOARD_WIDTH)}% - ${BALL_SCALED.radius}px)`
  ball.style.top = `calc(${100 * (state.ball.y / BOARD_HEIGHT)}% - ${BALL_SCALED.radius}px)`

  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)

