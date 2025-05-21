import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert, toIntegerValue } from '@sdk/index.js';
import { State } from '@core/state/State.js';

vi.mock('@sdk/index.js', async () => {
  const actual = await vi.importActual('@sdk/index.js');
  return {
    ...actual,
    toIntegerValue: vi.fn()
  };
});

it('fails if the resulting integer is not valid', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  vi.mocked(toIntegerValue).mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, '1 2 mul');
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
