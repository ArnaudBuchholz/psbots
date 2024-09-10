import { it, expect, beforeEach, afterEach } from 'vitest';
import { toValue } from '@test/index.js';
import { State } from './State.js';

let state: State;

beforeEach(() => {
  state = new State({ debugMemory: true });
  state.calls.push(toValue([1, 2, 3], { isExecutable: true }));
});

afterEach(() => {
  state.destroy();
});

it('executes each item individually (1)', () => {
  state.cycle();
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.ref[0]).toStrictEqual(toValue(1));
});

it('executes each item individually (2)', () => {
  state.cycle();
  state.cycle();
  expect(state.operands.ref).toStrictEqual([toValue(1)]);
  expect(state.calls.length).toStrictEqual(1);
});

it('executes each item individually (3)', () => {
  state.cycle();
  state.cycle();
  state.cycle();
  expect(state.operands.ref).toStrictEqual([toValue(1)]);
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.ref[0]).toStrictEqual(toValue(2));
});

it('executes each item individually (4)', () => {
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
  expect(state.calls.length).toStrictEqual(1);
});

it('executes each item individually (5)', () => {
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.ref[0]).toStrictEqual(toValue(3));
});

it('executes each item individually (6)', () => {
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  expect(state.operands.ref).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
  expect(state.calls.length).toStrictEqual(1);
});

it('executes each item individually (7)', () => {
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  expect(state.operands.ref).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
  expect(state.calls.length).toStrictEqual(0);
});
