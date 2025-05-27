import { nullValue } from '@psbots/engine';
import type { Value, IReadOnlyDictionary } from '@psbots/engine';

import type { IOperator } from '@psbots/engine/sdk';
import { assert, OperatorType, toIntegerValue } from '@psbots/engine/sdk';
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
const HOST_BALL_SPEED_X = 'ball_speed_x';
const HOST_BALL_SPEED_Y = 'ball_speed_y';
const HOST_PADDLE_UP = 'paddle_up';
const HOST_PADDLE_DOWN = 'paddle_down';

const safeToIntegerValue = (value: number): Value<'integer'> => {
  const result = toIntegerValue(value);
  assert(result);
  return result.value;
};

const buildIntegerOperatorValue = (name: string, impl: () => number): Value => ({
  type: 'operator',
  isExecutable: true,
  isReadOnly: true,
  operator: <IOperator>{
    name,
    type: OperatorType.implementation,
    implementation: ({ operands }) => operands.push(safeToIntegerValue(impl()))
  }
});

const buildModifierOperatorValue = (name: string, implementation: () => void): Value => ({
  type: 'operator',
  isExecutable: true,
  isReadOnly: true,
  operator: <IOperator>{
    name,
    type: OperatorType.implementation,
    implementation
  }
});

export class PaddleHost implements IReadOnlyDictionary {
  private _mappings: { [key in string]: Value } = {
    [HOST_BOARD_WIDTH]: safeToIntegerValue(BOARD_WIDTH),
    [HOST_BOARD_HEIGHT]: safeToIntegerValue(BOARD_HEIGHT),
    [HOST_PADDLE_WIDTH]: safeToIntegerValue(PADDLE_WIDTH),
    [HOST_PADDLE_HEIGHT]: safeToIntegerValue(PADDLE_HEIGHT),
    [HOST_CURRENT_X]: nullValue,
    [HOST_CURRENT_Y]: nullValue,
    [HOST_OPPONENT_X]: nullValue,
    [HOST_OPPONENT_Y]: nullValue,
    [HOST_BALL_CENTER_X]: nullValue,
    [HOST_BALL_CENTER_Y]: nullValue,
    [HOST_BALL_RADIUS]: safeToIntegerValue(BALL_RADIUS),
    [HOST_BALL_SPEED_X]: nullValue,
    [HOST_BALL_SPEED_Y]: nullValue,
    [HOST_PADDLE_UP]: nullValue,
    [HOST_PADDLE_DOWN]: nullValue
  };

  constructor(
    private _state: State,
    private _paddleIndex: number
  ) {
    this._mappings[HOST_CURRENT_X] =
      this._paddleIndex === 0 ? safeToIntegerValue(0) : safeToIntegerValue(BOARD_WIDTH - PADDLE_WIDTH);
    this._mappings[HOST_CURRENT_Y] = buildIntegerOperatorValue(
      'HOST_CURRENT_Y',
      () => this._state.paddles[this._paddleIndex].y
    );
    this._mappings[HOST_OPPONENT_X] =
      this._paddleIndex === 1 ? safeToIntegerValue(0) : safeToIntegerValue(BOARD_WIDTH - PADDLE_WIDTH);
    this._mappings[HOST_OPPONENT_Y] = buildIntegerOperatorValue(
      'HOST_OPPONENT_Y',
      () => this._state.paddles[1 - this._paddleIndex].y
    );
    this._mappings[HOST_BALL_CENTER_X] = buildIntegerOperatorValue('HOST_BALL_CENTER_X', () => this._state.ball.x);
    this._mappings[HOST_BALL_CENTER_Y] = buildIntegerOperatorValue('HOST_BALL_CENTER_Y', () => this._state.ball.y);
    this._mappings[HOST_BALL_SPEED_X] = buildIntegerOperatorValue('HOST_BALL_SPEED_X', () => this._state.ball.dx);
    this._mappings[HOST_BALL_SPEED_Y] = buildIntegerOperatorValue('HOST_BALL_SPEED_Y', () => this._state.ball.dy);
    this._mappings[HOST_PADDLE_UP] = buildModifierOperatorValue('HOST_PADDLE_UP', () => {
      this._state.addParticle({
        x: this._paddleIndex === 1 ? BOARD_WIDTH - PADDLE_WIDTH : 0,
        y: this._state.paddles[this._paddleIndex].y + PADDLE_HEIGHT,
        dx: 0,
        dy: 0,
        frames: 60,
        className: 'paddle-action',
        content: '⬆'
      });
      this._state.paddles[this._paddleIndex].dy = -1;
    });
    this._mappings[HOST_PADDLE_DOWN] = buildModifierOperatorValue('HOST_PADDLE_DOWN', () => {
      this._state.addParticle({
        x: this._paddleIndex === 1 ? BOARD_WIDTH - PADDLE_WIDTH : 0,
        y: this._state.paddles[this._paddleIndex].y,
        dx: 0,
        dy: 0,
        frames: 60,
        className: 'paddle-action',
        content: '⬇'
      });
      this._state.paddles[this._paddleIndex].dy = 1;
    });
  }

  get names() {
    return Object.keys(this._mappings);
  }

  lookup(name: string): Value {
    return this._mappings[name] ?? nullValue;
  }
}
