import { it, expect, beforeEach, afterEach } from 'vitest';
import type { IDebugSource } from '@api/index.js';
import { State } from '@core/state/State.js';
import { toValue, waitForGenerator } from '@test/index.js';

let state: State;

beforeEach(() => {
  state = new State({ debugMemory: true });
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
  await waitForGenerator(
    state.exec(
      Object.assign({
        debugSource,
        ...toValue(source, { isExecutable: true })
      })
    )
  );
  expect(state.operands.top.debugSource).toStrictEqual<IDebugSource>(debugSource);
});
