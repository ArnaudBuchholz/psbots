import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { toValue, waitForExec } from '@test/index.js';
import { REPEAT_VALUE, REPEAT_COUNT } from './repeat.js';

const names = {
  REPEAT_VALUE,
  REPEAT_COUNT
};

for (const [constant, constantValue] of Object.entries(names)) {
  it(`forwards CallStack::def error (${constant})`, async () => {
    const stateResult = State.create();
    assert(stateResult);
    const { value: state } = stateResult;
    const nativeMethod = CallStack.prototype.def;
    const methodSpy = vi.spyOn(CallStack.prototype, 'def');
    methodSpy.mockImplementation(function (this: CallStack, name, value) {
      if (name === constantValue) {
        return { success: false, exception: 'limitcheck' };
      }
      return nativeMethod.call(this, name, value);
    });
    await waitForExec(state.exec(toValue('1 1 repeat', { isExecutable: true })));
    methodSpy.mockRestore();
    expect(state.exception).toStrictEqual<Exception>('limitcheck');
  });
}

it('forwards Value::popush error', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(ValueStack.prototype, 'popush');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  await waitForExec(state.exec(toValue('1 1 repeat', { isExecutable: true })));
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});

it('forwards CallStack::push error', async () => {
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
  await waitForExec(state.exec(toValue('1 1 repeat', { isExecutable: true })));
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
