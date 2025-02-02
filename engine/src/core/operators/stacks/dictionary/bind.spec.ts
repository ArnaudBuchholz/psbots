import { it, expect, beforeEach, afterEach, vi, describe } from 'vitest';
import type { Exception, Value } from '@api/index.js';
import { assert, OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import { toValue, waitForExec } from '@test/index.js';
import { bind } from './bind.js';
import { State } from '@core/state/State.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
});

afterEach(() => {
  state.destroy();
});

describe('error handling', () => {
  let run: Generator;

  beforeEach(async () => {
    await waitForExec(state.exec(toValue('{ clear { bind } }', { isExecutable: true })));
    const execResult = state.exec(toValue('bind', { isExecutable: true }));
    assert(execResult);
    run = execResult.value;
    run.next(); // parser to name
    run.next(); // name to operator
  });

  afterEach(() => {
    let maxIterations = 100;
    let { done } = run.next();
    while (!done && --maxIterations) {
      done = run.next().done;
    }
    expect(maxIterations).toBeGreaterThan(0);
  });

  it('fails if not able to store an item in the array', () => {
    const set = vi.spyOn(ValueArray.prototype, 'set');
    set.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
    run.next();
    expect(state.exception).toStrictEqual<Exception>('limitcheck');
    expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_FIRST_CALL);
    set.mockRestore();
  });

  describe('recursivity', () => {
    beforeEach(() => {
      run.next();
    });

    it('fails if not able to store an item in the operand stack', () => {
      const push = vi.spyOn(ValueStack.prototype, 'push');
      push.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      expect(state.calls.operatorStateAt(0)).toStrictEqual(2);
      push.mockRestore();
    });

    it('fails if not able to store pop in the call stack', () => {
      const push = vi.spyOn(CallStack.prototype, 'push');
      push.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      expect(state.calls.operatorStateAt(0)).toStrictEqual(2);
      push.mockRestore();
    });

    it('fails if not able to store bind in the call stack', () => {
      const originalPush = CallStack.prototype.push;
      const push = vi.spyOn(CallStack.prototype, 'push');
      push.mockImplementation(function (this: CallStack, value: Value) {
        if (value === bind) {
          return { success: false, exception: 'limitcheck' };
        }
        return originalPush.call(this, value);
      });
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      push.mockRestore();
    });
  });
});
