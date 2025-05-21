import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';

it('forwards ValueStack::reserve error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(ValueStack.prototype, 'reserve');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, '[] aload');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
