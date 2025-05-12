import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { toValue, waitForExec } from '@test/index.js';

it('forwards ValueStack::reserve error', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(ValueStack.prototype, 'reserve');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  await waitForExec(state.exec(toValue('[] aload', { isExecutable: true })));
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
