import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

it('fails when no more memory is available', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const originalMethod = MemoryTracker.prototype.addStringRef;
  const methodSpy = vi.spyOn(MemoryTracker.prototype, 'addStringRef');
  methodSpy.mockImplementation(function (this: MemoryTracker, string) {
    if (string === '1') {
      return { success: false, exception: 'vmOverflow' };
    }
    return originalMethod.call(this, string);
  });
  run(state, '"123" 0 get');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('vmOverflow');
});
