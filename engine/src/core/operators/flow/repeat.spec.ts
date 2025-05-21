import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { REPEAT_VALUE } from './repeat.js';

it(`forwards CallStack::def error`, () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const nativeMethod = CallStack.prototype.def;
  const methodSpy = vi.spyOn(CallStack.prototype, 'def');
  methodSpy.mockImplementation(function (this: CallStack, name, value) {
    if (name === REPEAT_VALUE) {
      return { success: false, exception: 'limitcheck' };
    }
    return nativeMethod.call(this, name, value);
  });
  run(state, '1 1 repeat');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});

it('forwards Value::popush error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(ValueStack.prototype, 'popush');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, '1 1 repeat');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});

it('forwards CallStack::push error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const nativeMethod = CallStack.prototype.push;
  const methodSpy = vi.spyOn(CallStack.prototype, 'push');
  methodSpy.mockImplementation(function (this: CallStack, value) {
    if (value.type === 'integer') {
      return { success: false, exception: 'limitcheck' };
    }
    return nativeMethod.call(this, value);
  });
  run(state, '1 1 repeat');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
