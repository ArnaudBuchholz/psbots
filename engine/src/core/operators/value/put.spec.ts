import { it, expect, vi } from 'vitest';
import type { Exception } from '@api/index.js';
import { run } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { State } from '@core/state/State.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { ValueArray } from '@core/objects/ValueArray.js';

it('fails when no more memory is available', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const originalMethod = MemoryTracker.prototype.addStringRef;
  const methodSpy = vi.spyOn(MemoryTracker.prototype, 'addStringRef');
  methodSpy.mockImplementation(function (this: MemoryTracker, string) {
    if (string === 'a23') {
      return { success: false, exception: 'vmOverflow' };
    }
    return originalMethod.call(this, string);
  });
  run(state, '"123" 0 97 put');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('vmOverflow');
});

it('forwards Array::set error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const originaArraySet = ValueArray.prototype.set;
  const arraySet = vi.spyOn(ValueArray.prototype, 'set');
  arraySet.mockImplementation(function (this: ValueArray, index, value) {
    if (index === 1 && value.type === 'string') {
      return { success: false, exception: 'limitcheck' };
    }
    return originaArraySet.call(this, index, value);
  });
  run(state, '[ 1 2 3 ] 1 "a" put');
  arraySet.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});

it('forwards Dictionary::def error', () => {
  const stateResult = State.create();
  assert(stateResult);
  const { value: state } = stateResult;
  const methodSpy = vi.spyOn(Dictionary.prototype, 'def');
  methodSpy.mockImplementation(() => ({ success: false, exception: 'limitcheck' }));
  run(state, 'userdict /test 123 put');
  methodSpy.mockRestore();
  expect(state.exception).toStrictEqual<Exception>('limitcheck');
});
