import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { toValue, waitForExec } from '@test/index.js';

it('forwards Dictionary::def error', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(Dictionary.prototype, 'def');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  await waitForExec(state.exec(toValue('/test 1 def', { isExecutable: true })));
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
