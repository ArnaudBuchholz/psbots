import { it, expect, vi } from 'vitest';
import { assert, LimitcheckException } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { toValue, waitForGenerator } from '@test/index.js';

it('forwards Dictionary.create error', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const dictCreate = vi.spyOn(Dictionary, 'create');
  dictCreate.mockImplementation(() => ({ success: false, error: new LimitcheckException() }));
  await waitForGenerator(state.exec(toValue('<< /a 1 >>', { isExecutable: true })));
  dictCreate.mockRestore();
  expect(state.exception).toBeInstanceOf(LimitcheckException);
});

it('forwards Dictionary::def error', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const dictDef = vi.spyOn(Dictionary.prototype, 'def');
  dictDef.mockImplementation(() => ({ success: false, error: new LimitcheckException() }));
  await waitForGenerator(state.exec(toValue('<< /a 1 >>', { isExecutable: true })));
  dictDef.mockRestore();
  expect(state.exception).toBeInstanceOf(LimitcheckException);
});
