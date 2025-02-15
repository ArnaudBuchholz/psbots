import { createState } from '@psbots/engine';
import type { IState } from '@psbots/engine';
import { assert, toStringValue } from '@psbots/engine/sdk';
import { MAX_POINTS } from './constants.js';
import { State } from './State.js';
import { PaddleHost } from './PaddleHost.js';

export class Game {
  private _state: State;
  get state() {
    return this._state;
  }

  private _engines: IState[] = [];
  private _allocateEngine(paddleIndex: number) {
    const createStateResult = createState({
      hostDictionary: new PaddleHost(this._state, paddleIndex)
    });
    assert(createStateResult);
    const engine = createStateResult.value;
    this._engines[paddleIndex] = engine;
    return engine;
  }

  private _runners: Generator[] = [];

  private _speed = 1;
  get speed() {
    return this._speed;
  }

  private _ended = false;

  setup() {
    for (let paddleIndex = 0; paddleIndex < 2; ++paddleIndex) {
      const engine = this._allocateEngine(paddleIndex);
      const execResult = engine.exec(
        toStringValue(
          `
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
          { isExecutable: true }
        )
      );
      assert(execResult);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      [...execResult.value];
      // TODO: check if execution succeeded

      const runResult = engine.exec(toStringValue('main', { isExecutable: true }));
      this._state.paddles[paddleIndex].running = true;
      assert(runResult);
      this._runners[paddleIndex] = runResult.value;
    }
    this._state.ball.dx = 1;
    this._state.ball.dy = 1;
  }

  run(frames: number) {
    if (this._ended) {
      return;
    }
    let count = frames * this._speed;
    while (count-- > 0) {
      this._state.run();
      for (let paddleIndex = 0; !this._ended && paddleIndex < 2; ++paddleIndex) {
        const paddle = this._state.paddles[paddleIndex];
        if (paddle.score >= MAX_POINTS) {
          this._ended = true;
        } else if (paddle.running) {
          const { done } = this._runners[paddleIndex].next();
          if (done) {
            paddle.running = false;
          }
        }
      }
    }
  }

  constructor() {
    this._state = new State();
  }
}
