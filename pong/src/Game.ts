import { MAX_POINTS } from './constants.js';
import { State } from './State.js';

export class Game {
  private _state: State;
  get state() {
    return this._state;
  }

  private _speed = 1;
  get speed() {
    return this._speed;
  }

  private _ended = false;

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
