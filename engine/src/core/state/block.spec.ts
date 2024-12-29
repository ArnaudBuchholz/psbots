import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toValue } from '@test/index.js';
import { State } from './State.js';
import { assert } from '@sdk/index.js';
import { enumIArrayValues } from '@api/index.js';

let state: State;

describe('simple code block', () => {
  beforeEach(() => {
    const stateResult = State.create({ debugMemory: true });
    assert(stateResult);
    state = stateResult.value;
    state.calls.push(toValue([1, 2, 3], { isExecutable: true }));
  });

  afterEach(() => {
    state.destroy();
  });

  it('pushes the first operand (cycle 1)', () => {
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    expect(state.calls.length).toStrictEqual(1);
    expect(state.calls.topOperatorState).toStrictEqual(0);
  });

  it('pushes the second operand (cycle 2)', () => {
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
    expect(state.calls.length).toStrictEqual(1);
    expect(state.calls.topOperatorState).toStrictEqual(1);
  });

  it('pushes the third operand (cycle 3)', () => {
    state.cycle();
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
    expect(state.calls.length).toStrictEqual(1);
    expect(state.calls.topOperatorState).toStrictEqual(2);
  });

  it('unstacks itself (cycle 4)', () => {
    state.cycle();
    state.cycle();
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
    expect(state.calls.length).toStrictEqual(0);
  });
});

describe('code block with a call', () => {
  beforeEach(() => {
    const stateResult = State.create({ debugMemory: true });
    assert(stateResult);
    state = stateResult.value;
    state.calls.push(toValue([1, toValue('test', { isExecutable: true })], { isExecutable: true }));
  });

  afterEach(() => {
    state.destroy();
  });

  it('pushes the first operand (cycle 1)', () => {
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    expect(state.calls.length).toStrictEqual(1);
  });

  it('pushes the call (2)', () => {
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    expect(state.calls.length).toStrictEqual(2);
    expect(state.calls.top).toStrictEqual(toValue('test', { isExecutable: true }));
  });
});

describe('code block with code block', () => {
  const subCodeBlock = toValue([2], { isExecutable: true });
  beforeEach(() => {
    const stateResult = State.create({ debugMemory: true });
    assert(stateResult);
    state = stateResult.value;
    state.calls.push(toValue([1, subCodeBlock], { isExecutable: true }));
  });

  afterEach(() => {
    state.destroy();
  });

  it('pushes the first operand (cycle 1)', () => {
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    expect(state.calls.length).toStrictEqual(1);
  });

  it('considers the code block as an operand (cycle 2)', () => {
    state.cycle();
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([subCodeBlock, toValue(1)]);
    expect(state.calls.length).toStrictEqual(1);
  });
});
