import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';

it('forwards Dictionary::def error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(Dictionary.prototype, 'def');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, '/test 1 def');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
