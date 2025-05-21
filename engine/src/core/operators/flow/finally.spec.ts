import { it, expect, beforeEach, afterEach, vi, describe } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert, OPERATOR_STATE_CALL_BEFORE_POP, OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import { toValue } from '@test/index.js';
import { State } from '@core/state/State.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { CALLS_EXCEPTION, OPERATOR_STATE_POPPING } from './finally.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
});

describe('error handling', () => {
  let gen: Generator;

  beforeEach(() => {
    run(state, '{ undefined } { 1 }');
    const execResult = state.exec(toValue('finally', { isExecutable: true }));
    assert(execResult);
    gen = execResult.value;
    gen.next(); // parser to name
    gen.next(); // name to operator
  });

  afterEach(() => {
    let maxCycles = 100;
    let { done } = gen.next();
    while (!done && --maxCycles) {
      done = gen.next().done;
    }
    expect(maxCycles).toBeGreaterThan(0);
  });

  it('fails if not able to store mark position in stack', () => {
    const methodSpy = vi.spyOn(CallStack.prototype, 'def');
    methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
    gen.next();
    expect(state.exception).toStrictEqual<Exception>('limitcheck');
    expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_FIRST_CALL);
    expect(state.operands.length).toStrictEqual(2);
    methodSpy.mockRestore();
  });

  it('fails if not able to add the code block to stack', () => {
    const push = vi.spyOn(CallStack.prototype, 'push');
    push.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
    gen.next();
    expect(state.exception).toStrictEqual<Exception>('limitcheck');
    expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_CALL_BEFORE_POP);
    expect(state.operands.length).toStrictEqual(2);
    push.mockRestore();
  });

  describe('before pop', () => {
    beforeEach(() => {
      gen.next();
      while (state.calls.length !== 3) {
        gen.next();
      }
    });

    it('fails if not able to store exception in stack', () => {
      const methodSpy = vi.spyOn(CallStack.prototype, 'def');
      methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      gen.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_POPPING);
      expect(state.operands.length).toStrictEqual(0);
      methodSpy.mockRestore();
    });

    it('fails if not able to store exception stack in stack', () => {
      const originalMethod = CallStack.prototype.def;
      const methodSpy = vi.spyOn(CallStack.prototype, 'def');
      methodSpy.mockImplementation(function (this: CallStack, name, value) {
        if (name === CALLS_EXCEPTION) {
          return originalMethod.call(this, name, value);
        }
        return { success: false, exception: 'limitcheck' };
      });
      gen.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_POPPING);
      expect(state.operands.length).toStrictEqual(0);
      methodSpy.mockRestore();
    });
  });
});
