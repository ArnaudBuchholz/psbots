import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { assert, toIntegerValue } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { toValue, waitForExec } from '@test/index.js';

vi.mock('@sdk/index.js', async () => {
  const actual = await vi.importActual('@sdk/index.js');
  return {
    ...actual,
    toIntegerValue: vi.fn()
  };
});

it('fails if the resulting reminder is not valid', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  vi.mocked(toIntegerValue).mockImplementation((value) => {
    if (value === 0) {
      return { success: false, exception: 'limitcheck' };
    }
    return { success: true, value: { type: 'integer', isExecutable: false, isReadOnly: true, integer: 1 } };
  });
  await waitForExec(state.exec(toValue('1 1 div', { isExecutable: true })));
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});

it('fails if the resulting dividend is not valid', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  vi.mocked(toIntegerValue).mockImplementation((value) => {
    if (value === 1) {
      return { success: false, exception: 'limitcheck' };
    }
    return { success: true, value: { type: 'integer', isExecutable: false, isReadOnly: true, integer: 0 } };
  });
  await waitForExec(state.exec(toValue('1 1 div', { isExecutable: true })));
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
