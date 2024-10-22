import { it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { ExceptionDictionaryName } from '@api/index.js';
import type { IDebugSource, IDictionary, Value } from '@api/index.js';
import { toValue, waitForGenerator } from '@test/index.js';
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
  state.calls.push(toValue(Symbol.for('mark'), { isExecutable: true }));
  state.cycle();
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.ref[0]).toStrictEqual(markOp);
});

it('is popped once the corresponding value has been processed', () => {
  state.calls.push(toValue(Symbol.for('mark'), { isExecutable: true }));
  state.cycle();
  state.cycle();
  expect(state.calls.length).toStrictEqual(1);
  expect(state.operands.ref).toStrictEqual([toValue.mark]);
  state.cycle();
  expect(state.calls.length).toStrictEqual(0);
  expect(state.operands.ref).toStrictEqual([toValue.mark]);
});

it("throws an exception if the value can't be found", () => {
  state.calls.push(toValue(Symbol.for('unknown call'), { isExecutable: true }));
  state.cycle();
  expect(state.exception).not.toBeUndefined();
  expect(state.exception?.lookup(ExceptionDictionaryName.name)).toStrictEqual(toValue('UndefinedException'));
});

it('puts the call in the operand stack when calls are prevented', () => {
  state.preventCall();
  const markCall = toValue(Symbol.for('mark'), { isExecutable: true });
  state.calls.push(markCall);
  state.cycle();
  expect(state.calls.length).toStrictEqual(0);
  expect(state.operands.ref).toStrictEqual([markCall]);
});

it('*always* execute { and } even if it changes callEnabled', () => {
  state.calls.push(toValue(Symbol.for('{'), { isExecutable: true }));
  state.cycle();
  state.cycle();
  expect(state.callEnabled).toStrictEqual(false);
  state.calls.push(toValue(Symbol.for('}'), { isExecutable: true }));
  state.cycle();
  state.cycle();
  expect(state.callEnabled).toStrictEqual(true);
});

it('*always* execute { and } (cumulated)', () => {
  waitForGenerator(state.exec(toValue('{ { } { } }', { isExecutable: true })));
  expect(state.callEnabled).toStrictEqual(true);
});

it('forwards debug info to the resolved value (if none)', () => {
  const call = toValue(Symbol.for('mark'), { isExecutable: true });
  const debugSource: IDebugSource = {
    filename: 'filename',
    length: 2,
    pos: 1,
    source: 'source'
  };
  state.calls.push(Object.assign(call, { debugSource }));
  state.cycle();
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.top.debugSource).toStrictEqual(debugSource);
});

it('does not forward debug info to the resolved value if it already contains some', () => {
  const debugSourceOfValue: IDebugSource = {
    filename: 'test',
    length: 4,
    pos: 2,
    source: 'test'
  };
  const value = Object.assign(toValue('test'), {
    debugSource: debugSourceOfValue
  });
  (state.dictionaries.top.dictionary as IDictionary).def('test', value);
  const call = toValue(Symbol.for('test'), { isExecutable: true });
  const debugSource: IDebugSource = {
    filename: 'filename',
    length: 2,
    pos: 1,
    source: 'source'
  };
  state.calls.push(Object.assign(call, { debugSource }));
  state.cycle();
  expect(state.calls.length).toStrictEqual(2);
  expect(state.calls.top.debugSource).toStrictEqual(debugSourceOfValue);
});
