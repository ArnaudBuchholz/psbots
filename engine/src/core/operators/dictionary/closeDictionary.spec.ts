import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';

it('forwards Dictionary.create error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const dictCreate = vi.spyOn(Dictionary, 'create');
  dictCreate.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, '<< /a 1 >>');
  dictCreate.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});

it('forwards Dictionary::def error', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(Dictionary.prototype, 'def');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, '<< /a 1 >>');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
