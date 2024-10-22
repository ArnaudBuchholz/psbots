import { it, expect, beforeEach, afterEach } from 'vitest';
import type { IDebugSource, Value } from '@api/index.js';
import { toValue } from '@test/index.js';
import { State } from './State.js';

let state: State;

beforeEach(() => {
  state = new State({ debugMemory: true });
});

afterEach(() => {
  state.destroy();
});

it('parses and stacks tokens', () => {
  state.calls.push(toValue('123 456 789', { isExecutable: true }));
  state.cycle();
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  state.cycle();
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(456), toValue(123)]);
  state.cycle();
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(789), toValue(456), toValue(123)]);
  expect(state.calls.length).toStrictEqual(1);
  state.cycle();
  expect(state.operands.ref).toStrictEqual<Value[]>([toValue(789), toValue(456), toValue(123)]);
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
  expect(state.operands.ref).toStrictEqual<Value[]>([
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
