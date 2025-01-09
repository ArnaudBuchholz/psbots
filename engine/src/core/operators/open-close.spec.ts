import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Exception, IDebugSource } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { toValue, waitForExec } from '@test/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
});

afterEach(() => {
  state.destroy();
});

it('forwards debug info', async () => {
  const source = '[ 1 2 3 ]';
  const debugSource = {
    filename: 'test',
    pos: 0,
    length: 9,
    source
  } satisfies IDebugSource;
  await waitForExec(
    state.exec(
      Object.assign({
        debugSource,
        ...toValue(source, { isExecutable: true })
      })
    )    
  );
  expect(state.operands.top.debugSource).toStrictEqual<IDebugSource>(debugSource);
});

it('forwards error if the array cannot be created', async () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  vi.spyOn(ValueArray, 'create').mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  await waitForExec(state.exec(toValue('[ ]', { isExecutable: true })));
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
