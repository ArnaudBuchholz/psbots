import { Game } from './Game.js';
import { start } from './renderer.js';
import { MAX_POINTS } from './constants.js';

const scripts = {
  follower: `
/main
{
  {
    % Adjust pad position based on current position of the ball
    ball_center_y % ball position
    current_y paddle_height 2 div pop add % center of paddle
    lt
    {
      paddle_up
    }
    {
      paddle_down
    }
    ifelse
  } loop
} bind def
  `,
  center_or_follow: `
/main
{
  {
    current_y paddle_height 2 div pop add % center of paddle
  
    current_x 0 eq ball_speed_x 0 lt and % left paddle, ball coming
    current_x 0 neq ball_speed_x 0 gt and % right paddle, ball coming
    or
    {
      % follow the ball
      ball_center_y % ball position
    }
    {
      % back to center
      board_height 2 div pop % board center
    }
    ifelse

    lt
    {
      paddle_down
    }
    {
      paddle_up
    }
    ifelse
  } loop
} bind def
`
};

const game = new Game();
game.setup({
  scripts: [scripts.follower, scripts.center_or_follow],
  maxPoints: MAX_POINTS
});
start(game);

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    game.decreaseSpeed();
  } else if (event.key === 'ArrowRight') {
    game.increaseSpeed();
  } else if (event.key === 'ArrowUp') {
     game.resetSpeed  ();
  }else if (event.key === 'ArrowDown') {
    game.oneStep();
  }
});
