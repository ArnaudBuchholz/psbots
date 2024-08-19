import { it, expect, beforeEach, afterEach } from 'vitest';
import { parse } from '@api/index.js';
import type { Value } from '@api/index.js';
import { State } from './State.js';
import { waitForGenerator, toValue } from '@test/index.js';

let state: State;

beforeEach(() => {
  state = new State();
});

afterEach(() => {
  state.destroy();
});

it('processes a string', () => {
  expect(state.idle).toStrictEqual(true);
  const generator = state.process('123');
  expect(state.idle).toStrictEqual(false);
  waitForGenerator(generator);
  expect(state.idle).toStrictEqual(true);
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
});

it('processes an array', () => {
  expect(state.idle).toStrictEqual(true);
  const generator = state.process([toValue(123)]);
  expect(state.idle).toStrictEqual(false);
  waitForGenerator(generator);
  expect(state.idle).toStrictEqual(true);
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
});

it('processes a generator', () => {
  expect(state.idle).toStrictEqual(true);
  const generator = state.process(parse('123'));
  expect(state.idle).toStrictEqual(false);
  waitForGenerator(generator);
  expect(state.idle).toStrictEqual(true);
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
});

it('fails if already busy', () => {
  expect(state.idle).toStrictEqual(true);
  state.process(parse('123'));
});
