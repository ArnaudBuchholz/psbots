import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enumIArrayValues } from '@api/index.js';
import type { IDebugSource, Value } from '@api/index.js';
import { toValue } from '@test/index.js';
import { State } from './State.js';
import { assert } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/index.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
});

afterEach(() => {
  state.destroy();
});

it('parses and stacks tokens', () => {
  state.calls.push(toValue('123 456 789', { isExecutable: true }));
  state.cycle();
  expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([toValue(123)]);
  state.cycle();
  expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([toValue(456), toValue(123)]);
  state.cycle();
  expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([toValue(789), toValue(456), toValue(123)]);
  expect(state.calls.length).toStrictEqual(1);
  state.cycle();
  expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([toValue(789), toValue(456), toValue(123)]);
  expect(state.calls.length).toStrictEqual(0);
});

it('forwards debugging information', () => {
  const filename = 'test.ps';
  const source = '123 456 789';
  state.calls.push(
    Object.assign(
      {
        debugSource: <IDebugSource>{
          filename,
          pos: 0,
          length: '123 456 789'.length,
          source
        }
      },
      toValue(source, { isExecutable: true })
    )
  );
  state.cycle();
  state.cycle();
  state.cycle();
  state.cycle();
  expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([
    Object.assign(
      {
        debugSource: {
          filename,
          pos: 8,
          length: 3,
          source
        }
      },
      toValue(789)
    ),
    Object.assign(
      {
        debugSource: {
          filename,
          pos: 4,
          length: 3,
          source
        }
      },
      toValue(456)
    ),
    Object.assign(
      {
        debugSource: {
          filename,
          pos: 0,
          length: 3,
          source
        }
      },
      toValue(123)
    )
  ]);
  expect(state.calls.length).toStrictEqual(0);
});

describe('memory tracker', () => {
  it('sets a tracker on names', () => {
    state.calls.push(toValue('/abc', { isExecutable: true }));
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([
      Object.assign({ tracker: state.memoryTracker }, toValue(Symbol.for('abc')))
    ]);
    expect(state.calls.length).toStrictEqual(0);
  });

  it('sets a tracker on strings', () => {
    state.calls.push(toValue('"abc"', { isExecutable: true }));
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([
      Object.assign({ tracker: state.memoryTracker }, toValue('abc'))
    ]);
    expect(state.calls.length).toStrictEqual(0);
  });

  it('fails if no more memory', () => {
    state.calls.push(toValue('"abc"', { isExecutable: true }));
    const methodSpy = vi.spyOn(MemoryTracker.prototype, 'addStringRef');
    methodSpy.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
    state.cycle();
    methodSpy.mockRestore();
    expect(state.exception).toStrictEqual('vmOverflow');
  });

  it('forwards ValueStack::push error', () => {
    state.calls.push(toValue('"abc"', { isExecutable: true }));
    const push = vi.spyOn(ValueStack.prototype, 'push');
    push.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
    state.cycle();
    push.mockRestore();
    expect(state.exception).toStrictEqual('vmOverflow');
  });
});
