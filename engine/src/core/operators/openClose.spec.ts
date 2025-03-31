import { it, expect, beforeEach, afterEach, vi, describe } from 'vitest';
import type { Exception, IDebugSource } from '@api/index.js';
import { markValue } from '@api/index.js';
import { assert, OPERATOR_STATE_FIRST_CALL } from '@sdk/index.js';
import { toValue, waitForExec } from '@test/index.js';
import { State } from '@core/state/State.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { OPERATOR_STATE_ALLOC_ARRAY } from './openClose.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
});

afterEach(() => {
  state.destroy();
});

it('forwards debug info', async () => {
  const source = '[ 1 2 3 ]';
  const debugSource = {
    filename: 'test',
    pos: 0,
    length: 9,
    source
  } satisfies IDebugSource;
  await waitForExec(
    state.exec(
      Object.assign({
        debugSource,
        ...toValue(source, { isExecutable: true })
      })
    )
  );
  expect(state.operands.top.debugSource).toStrictEqual<IDebugSource>(debugSource);
});

describe('error handling', () => {
  let run: Generator;

  beforeEach(async () => {
    await waitForExec(state.exec(toValue('[ 1 ', { isExecutable: true })));
    const execResult = state.exec(toValue(']', { isExecutable: true }));
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
    expect(state.operands.at(0)).toStrictEqual(toValue(1));
    expect(state.operands.at(1)).toStrictEqual(markValue);
  });

  it('fails if not able to store mark position in stack', () => {
    const methodSpy = vi.spyOn(CallStack.prototype, 'def');
    methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
    run.next();
    expect(state.exception).toStrictEqual<Exception>('limitcheck');
    // Reset operator state
    expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_FIRST_CALL);
    methodSpy.mockRestore();
  });

  describe('OPERATOR_STATE_ALLOC_ARRAY', () => {
    beforeEach(() => {
      run.next();
    });

    it('fails if the array cannot be created', async () => {
      const create = vi.spyOn(ValueArray, 'create');
      create.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      // Reset operator state
      expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_ALLOC_ARRAY);
      create.mockRestore();
    });

    it('fails if not able to store array in stack', () => {
      const methodSpy = vi.spyOn(CallStack.prototype, 'def');
      methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      // Reset operator state
      expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_ALLOC_ARRAY);
      methodSpy.mockRestore();
    });
  });

  describe('setting array items', () => {
    beforeEach(() => {
      run.next();
      run.next();
    });

    it('fails if not able to store an item in the array', () => {
      const set = vi.spyOn(ValueArray.prototype, 'set');
      set.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      // Reset operator state
      expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_ALLOC_ARRAY);
      set.mockRestore();
    });
  });

  describe('final step', () => {
    beforeEach(() => {
      run.next();
      run.next();
      run.next();
    });

    it('fails if not able to add the array in the operands stack', () => {
      const popush = vi.spyOn(ValueStack.prototype, 'popush');
      popush.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
      run.next();
      expect(state.exception).toStrictEqual<Exception>('limitcheck');
      // Reset operator state
      expect(state.calls.operatorStateAt(0)).toStrictEqual(OPERATOR_STATE_ALLOC_ARRAY);
      popush.mockRestore();
    });
  });
});
