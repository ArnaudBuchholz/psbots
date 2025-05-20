import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { IState } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { createState } from '../index.js';
import { run, RunError } from './run.js';
import { toValue } from '@test/toValue.js';

let state: IState;

beforeEach(() => {
  const created = createState();
  assert(created);
  state = created.value;
});

afterEach(() => {
  state.destroy();
});

it('executes all iterations', () => {
  run(state, '50 "a" repeat');
  expect(state.operands.length).toStrictEqual(50);
});

it('stops after the maximum number of iterations', () => {
  run(state, '1000 "a" repeat');
  expect(state.operands.length).toBeLessThan(1000);
});

it('does not run if max iterations is negative', () => {
  run(state, '50 "a" repeat', { maxIterations: -1 });
  expect(state.operands.length).toStrictEqual(0);
});

it('supports value as input', () => {
  run(state, toValue(0));
  expect(state.operands.at(0)).toStrictEqual(toValue(0));
});

describe('exception handling', () => {
  it('exposes an error class', () => {
    const error = new RunError('invalidAccess');
    expect(error.name).toStrictEqual('RunError');
    expect(error.message).toStrictEqual('invalidAccess');
    expect(error.exception).toStrictEqual('invalidAccess');
  });

  it('throws if the engine is not idle', () => {
    state.exec(toValue(0));
    expect(() => run(state, '1')).toThrow(new RunError('invalidAccess'));
  });

  it('does not throw by default', () => {
    expect(() => run(state, 'limitcheck')).not.toThrow();
  });

  it('throws when the option is set', () => {
    expect(() => run(state, 'limitcheck', { throwException: true })).toThrow(new RunError('limitcheck'));
  });
});
