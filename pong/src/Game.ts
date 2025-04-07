import { createState, enumIArrayValues } from '@psbots/engine';
import type { IState } from '@psbots/engine';
import { assert, callStackToString, run, toString, toStringValue } from '@psbots/engine/sdk';
import { MAX_POINTS } from './constants.js';
import { State } from './State.js';
import { PaddleHost } from './PaddleHost.js';

type GameSetup = {
  scripts: [string, string];
  maxPoints: number;
};

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

  modifySpeed(increment: number) {
    this._speed = Math.min(Math.max(this._speed + increment, 1), 1000);
  }

  private _maxPoints = MAX_POINTS;
  private _ended = false;

  setup({ scripts, maxPoints }: GameSetup) {
    this._maxPoints = maxPoints;
    for (let paddleIndex = 0; paddleIndex < 2; ++paddleIndex) {
      const engine = this._allocateEngine(paddleIndex);
      run(engine.exec(toStringValue(scripts[paddleIndex], { isExecutable: true })));
      const runResult = engine.exec(toStringValue('main', { isExecutable: true }));
      this._state.paddles[paddleIndex].running = true;
      assert(runResult);
      this._runners[paddleIndex] = runResult.value;
    }
    this._state.ball.dx = 1;
    this._state.ball.dy = 1;
  }

  private _engineStopped(paddleIndex: number) {
    console.log(`${paddleIndex ? 'Right' : 'Left'} paddle stopped running`);
    const engine = this._engines[paddleIndex];
    const { exception } = engine;
    if (exception) {
      console.log(`❌ ${exception}`);
      const { exceptionStack } = engine;
      if (exceptionStack) {
        for (const line of callStackToString(exceptionStack)) {
          console.log(line);
        }
      }
    }
    this._state.paddles[paddleIndex].running = false;
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
        if (paddle.score >= this._maxPoints) {
          this._ended = true;
        } else if (paddle.running) {
          const { done } = this._runners[paddleIndex].next();
          if (done) {
            this._engineStopped(paddleIndex);
          }
        }
      }
    }
    this._state.addParticle({
      x: this._state.ball.x,
      y: this._state.ball.y,
      dx: 0,
      dy: 0,
      frames: 60 * this._speed,
      className: 'ball_spark'
    });
  }

  getEngineState(paddleIndex: number): string {
    const engine = this._engines[paddleIndex];
    const { operands, calls } = engine;
    return [
      `Operands: ${operands.length}`,
      ...[...enumIArrayValues(operands)].map((value) => toString(value, { maxWidth: 40 })),
      `Call stack: ${calls.length}`,
      ...[...enumIArrayValues(calls)].map((value, index) =>
        toString(value, { maxWidth: 40, operatorState: calls.operatorStateAt(index) })
      )
    ].join('\n');
  }

  constructor() {
    this._state = new State();
  }
}
