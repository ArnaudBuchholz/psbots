import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { LOOP_BLOCK } from './loop.js';

it('forwards CallStack::def error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const nativeMethod = CallStack.prototype.def;
  const methodSpy = vi.spyOn(CallStack.prototype, 'def');
  methodSpy.mockImplementation(function (this: CallStack, name, value) {
    if (name === LOOP_BLOCK) {
      return { success: false, exception: 'limitcheck' };
    }
    return nativeMethod.call(this, name, value);
  });
  run(state, '{} loop');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
