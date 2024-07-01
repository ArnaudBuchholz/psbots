import { describe, it, expect, beforeEach } from 'vitest';
import type { IReadOnlyArray, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { MemoryTracker, ShareableObject } from '@core/index.js';
import { InternalException } from '@sdk/exceptions/index.js';
import { AbstractValueArray } from './AbstractValueArray.js';
import { toValue } from '@test/index.js';

class MyValueArray extends AbstractValueArray {
  protected pushImpl(value: Value): void {
    this._values.push(value);
  }

  protected popImpl(): Value | null {
    const value = this._values.at(-1);
    this._values.pop();
    return value ?? null;
  }

  public getMemoryTracker(): MemoryTracker {
    return this.memoryTracker;
  }

  public clear(): void {
    this._clear();
  }
}

class MyArray extends ShareableObject implements IReadOnlyArray {
  public disposeCalled: number = 0;

  protected _dispose(): void {
    ++this.disposeCalled;
  }

  get length(): number {
    return 0;
  }

  at(): null {
    return null;
  }
}

describe('AbstractValueArray', () => {
  let tracker: MemoryTracker;
  let valueArray: MyValueArray;
  let arrayObject: MyArray;
  let arrayValue: Value;

  beforeEach(() => {
    tracker = new MemoryTracker();
    valueArray = new MyValueArray(tracker, 'user');
    arrayObject = new MyArray();
    arrayValue = {
      type: ValueType.array,
      isReadOnly: true,
      isExecutable: false,
      tracker: ShareableObject.tracker,
      array: arrayObject
    };
    expect(arrayObject.refCount).toStrictEqual(1);
    valueArray.push(toValue(1));
    valueArray.push(toValue('abc'));
    valueArray.push(arrayValue);
    expect(arrayObject.refCount).toStrictEqual(2);
    arrayObject.release();
    expect(arrayObject.refCount).toStrictEqual(1);
  });

  it('tracks memory used', () => {
    expect(tracker.used).not.toStrictEqual(0);
  });

  it('exposes the memory tracker', () => {
    expect(valueArray.getMemoryTracker()).toStrictEqual(tracker);
  });

  it('offers an valueArray reference', () => {
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue('abc'), arrayValue]);
  });

  describe('IArray', () => {
    it('exposes length', () => {
      expect(valueArray.length).toStrictEqual(3);
    });

    it('exposes at', () => {
      expect(valueArray.at(0)).toStrictEqual<Value>(toValue(1));
    });

    it('controls boundaries (-1)', () => {
      expect(valueArray.at(-1)).toStrictEqual(null);
    });

    it('controls boundaries (0-based)', () => {
      expect(valueArray.at(valueArray.length)).toStrictEqual(null);
    });
  });

  describe('removing items', () => {
    it('releases memory when removing items', () => {
      const before = tracker.used;
      valueArray.pop();
      expect(tracker.used).toBeLessThan(before);
      expect(arrayObject.refCount).toStrictEqual(0);
    });

    it('fails after all items were removed', () => {
      valueArray.clear();
      expect(() => valueArray.pop()).toThrowError(InternalException);
    });
  });

  it('releases memory once disposed', () => {
    valueArray.release();
    expect(arrayObject.refCount).toStrictEqual(0);
    expect(tracker.used).toStrictEqual(0);
  });
});
