import { it, expect } from 'vitest';
import { run } from './run.js';
import type { Result } from '@api/index.js';

it('executes all iterations', () => {
  let finished = false;
  const iterator = function* () {
    for (let index = 0; index < 100; ++index) {
      yield index;
    }
    finished = true;
  };
  const result: Result<Generator> = { success: true, value: iterator() };
  expect(run(result)).toStrictEqual(101);
  expect(finished).toStrictEqual(true);
});

it('stops after the maximum number of iterations', () => {
  let index = 0;
  const iterator = function* () {
    for (index = 0; index < 10_000; ++index) {
      yield index;
    }
  };
  const result: Result<Generator> = { success: true, value: iterator() };
  expect(run(result, { maxIterations: 100 })).toStrictEqual(100);
  expect(index).toStrictEqual(99);
});

it('does not run if max iterations is negative', () => {
  const iterator = function* () {
    for (let index = 0; index < 10_000; ++index) {
      yield index;
    }
  };
  const result: Result<Generator> = { success: true, value: iterator() };
  expect(run(result, { maxIterations: -1 })).toStrictEqual(0);
});
