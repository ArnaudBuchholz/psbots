import { it, expect, beforeEach, afterEach } from 'vitest';
import type { IDebugSource } from '@api/index.js';
import { parse } from '@api/index.js';
import { State } from '@core/state/State.js';
import { waitForGenerator } from '@test/wait-for-generator.js';

let state: State;

beforeEach(() => {
  state = new State({ debugMemory: true });
});

afterEach(() => {
  state.destroy();
});

it('forwards debug info', async () => {
  const source = '[ 1 2 3 ]';
  await waitForGenerator(state.process(parse(source, 0, 'test')));
  expect(state.operands.top.debugSource).toStrictEqual<IDebugSource>({
    filename: 'test',
    pos: 0,
    length: 9,
    source
  });
});
