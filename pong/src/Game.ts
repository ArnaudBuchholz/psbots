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
  private _allocateEngine (paddleIndex: number) {
    const createStateResult = createState({
      hostDictionary: new PaddleHost(this._state, paddleIndex)
    });
    assert(createStateResult);
    const engine = createStateResult.value
    this._engines[paddleIndex] = engine;
    return engine;
  }

  private _speed = 1;
  get speed() {
    return this._speed;
  }

  private _ended = false;

  setup() {
    for (let paddleIndex = 0; paddleIndex < 2; ++paddleIndex) {
      const engine = this._allocateEngine(paddleIndex);
      const execResult = engine.exec(toStringValue(`
/main
{
  {
    % Adjust pad position based on current position of the ball
    ball_center_y current_y paddle_height 2 div pop add lt "up" "down" ifelse
    set_direction
  } loop
} bind def
`, { isExecutable: true }));
      assert(execResult);
      [...execResult.value];
    }
  }

  run(frames: number) {
    if (this._ended) {
      return;
    }
    let count = frames * this._speed;
    while (count-- > 0) {
      this._state.run();
      if (this._state.paddles[0].score >= MAX_POINTS || this._state.paddles[1].score >= MAX_POINTS) {
        this._ended = true;
      }
    }
  }

  constructor() {
    this._state = new State();
  }
}
