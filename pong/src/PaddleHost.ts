import { nullValue } from '@psbots/engine';
import type { Value, IReadOnlyDictionary, ValueType } from '@psbots/engine';
import { assert, toIntegerValue } from '@psbots/engine/sdk';
import type { State } from './State.js';
import { BALL_RADIUS, BOARD_HEIGHT, BOARD_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH } from './constants.js';

const HOST_BOARD_WIDTH = 'board_width';
const HOST_BOARD_HEIGHT = 'board_height';
const HOST_PADDLE_WIDTH = 'paddle_width';
const HOST_PADDLE_HEIGHT = 'paddle_height';
const HOST_CURRENT_Y = 'current_y';
const HOST_CURRENT_X = 'current_x';
const HOST_OPPONENT_Y = 'opponent_y';
const HOST_OPPONENT_X = 'opponent_x';
const HOST_BALL_CENTER_X = 'ball_center_x';
const HOST_BALL_CENTER_Y = 'ball_center_y';
const HOST_BALL_RADIUS = 'ball_radius';
const HOST_BALL_SPEED_X = `ball_speed_x`;
const HOST_BALL_SPEED_Y = `ball_speed_y`;

const safeToIntegerValue = (value: number): Value<ValueType.integer> => {
  const result = toIntegerValue(value);
  assert(result);
  return result.value;
};

export class PaddleHost implements IReadOnlyDictionary {
  constructor(
    private _state: State,
    private _paddleIndex: number
  ) {}

  get names() {
    return [
      HOST_BOARD_WIDTH,
      HOST_BOARD_HEIGHT,
      HOST_PADDLE_WIDTH,
      HOST_PADDLE_HEIGHT,
      HOST_CURRENT_X,
      HOST_CURRENT_Y,
      HOST_OPPONENT_X,
      HOST_OPPONENT_Y,
      HOST_BALL_CENTER_X,
      HOST_BALL_CENTER_Y,
      HOST_BALL_RADIUS,
      HOST_BALL_SPEED_X,
      HOST_BALL_SPEED_Y
    ];
  }

  // TODO: need to return operators because of bind
  lookup(name: string): Value {
    if (name === HOST_BOARD_WIDTH) {
      return safeToIntegerValue(BOARD_WIDTH);
    }
    if (name === HOST_BOARD_HEIGHT) {
      return safeToIntegerValue(BOARD_HEIGHT);
    }
    if (name === HOST_PADDLE_WIDTH) {
      return safeToIntegerValue(PADDLE_WIDTH);
    }
    if (name === HOST_PADDLE_HEIGHT) {
      return safeToIntegerValue(PADDLE_HEIGHT);
    }
    if (name === HOST_CURRENT_X) {
      if (this._paddleIndex === 0) {
        return safeToIntegerValue(0);
      }
      return safeToIntegerValue(BOARD_WIDTH - PADDLE_WIDTH);
    }
    if (name === HOST_CURRENT_Y) {
      return safeToIntegerValue(this._state.paddles[this._paddleIndex].y);
    }
    if (name === HOST_OPPONENT_X) {
      if (this._paddleIndex === 1) {
        return safeToIntegerValue(0);
      }
      return safeToIntegerValue(BOARD_WIDTH - PADDLE_WIDTH);
    }
    if (name === HOST_OPPONENT_Y) {
      return safeToIntegerValue(this._state.paddles[1 - this._paddleIndex].y);
    }
    if (name === HOST_BALL_CENTER_X) {
      return safeToIntegerValue(this._state.ball.x);
    }
    if (name === HOST_BALL_CENTER_Y) {
      return safeToIntegerValue(this._state.ball.y);
    }
    if (name === HOST_BALL_RADIUS) {
      return safeToIntegerValue(BALL_RADIUS);
    }
    if (name === HOST_BALL_SPEED_X) {
      return safeToIntegerValue(this._state.ball.dx);
    }
    if (name === HOST_BALL_SPEED_Y) {
      return safeToIntegerValue(this._state.ball.dy);
    }
    return nullValue;
  }
}
