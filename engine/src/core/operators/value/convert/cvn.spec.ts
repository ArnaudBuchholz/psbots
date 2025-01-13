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
  const originalAddStringRef = MemoryTracker.prototype.addStringRef;
  const addStringRef = vi.spyOn(MemoryTracker.prototype, 'addStringRef');
  addStringRef.mockImplementation(function (this: MemoryTracker, string) {
    if (string.startsWith('@psbots/engine')) {
      return { success: false, exception: 'vmOverflow' };
    }
    return originalAddStringRef.call(this, string);
  });
  // version is an untracked string !
  await waitForExec(state.exec(toValue('version cvn', { isExecutable: true })));
  addStringRef.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('vmOverflow');
});
