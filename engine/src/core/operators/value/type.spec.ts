import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { toValue, waitForExec } from '@test/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

it('fails when no more memory is available', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const originalMethod = MemoryTracker.prototype.addStringRef;
  const methodSpy = vi.spyOn(MemoryTracker.prototype, 'addStringRef');
  methodSpy.mockImplementation(function (this: MemoryTracker, string) {
    if (string === 'integer') {
      return { success: false, exception: 'vmOverflow' };
    }
    return originalMethod.call(this, string);
  });
  await waitForExec(state.exec(toValue('1 type', { isExecutable: true })));
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('vmOverflow');
});
