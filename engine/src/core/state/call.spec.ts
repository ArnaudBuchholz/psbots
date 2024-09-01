import { it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { ExceptionDictionaryName } from '@api/index.js';
import type { Value } from '@api/index.js';
import { toValue } from '@test/index.js';
import { State } from './State.js';
import { SystemDictionary } from '@core/objects/dictionaries/System.js';

let state: State;
let markOp: Value;

beforeAll(() => {
  const lookUpResult = SystemDictionary.instance.lookup('mark');
  if (lookUpResult === null) {
    throw new Error('mark is not part of System dictionary');
  }
  markOp = lookUpResult;
});

beforeEach(() => {
  state = new State({ debugMemory: true });
});

afterEach(() => {
  state.destroy();
});

it('searches for the corresponding value', () => {
  state.calls.push(toValue('mark', { isExecutable: true }));
  state.cycle();
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.ref[0]).toStrictEqual(markOp);
});

it('is popped once the corresponding value has been processed', () => {
  state.calls.push(toValue('mark', { isExecutable: true }));
  state.cycle();
  state.cycle();
  expect(state.calls.length).toStrictEqual(1);
  expect(state.operands.ref).toStrictEqual([toValue.mark]);
  state.cycle();
  expect(state.calls.length).toStrictEqual(0);
  expect(state.operands.ref).toStrictEqual([toValue.mark]);
});

it("throws an exception if the value can't be found", () => {
  state.calls.push(toValue('unknown call', { isExecutable: true }));
  state.cycle();
  expect(state.exception).not.toBeUndefined();
  expect(state.exception?.lookup(ExceptionDictionaryName.name)).toStrictEqual(toValue('UndefinedException'));
});

it('puts the call in the operand stack when calls are prevented', () => {
  state.preventCall();
  const markCall = toValue('mark', { isExecutable: true });
  state.calls.push(markCall);
  state.cycle();
  expect(state.calls.length).toStrictEqual(0);
  expect(state.operands.ref).toStrictEqual([markCall]);
});
