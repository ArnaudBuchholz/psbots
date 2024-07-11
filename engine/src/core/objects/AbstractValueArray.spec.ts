import { describe, it, expect, beforeEach } from 'vitest';
import type { IReadOnlyArray, MemoryType, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { MemoryTracker, ShareableObject } from '@core/index.js';
import { InternalException } from '@sdk/exceptions/index.js';
import { AbstractValueArray } from './AbstractValueArray.js';
import { toValue } from '@test/index.js';

class MyValueArray extends AbstractValueArray {
  protected pushImpl(value: Value): void {
    this._values.push(value);
  }

  private _popNull: boolean = false;

  protected popImpl(): Value | null {
    if (this._popNull) {
      return null;
    }
    const value = this.atOrThrow(-1);
    this._values.pop();
    return value;
  }

  public getMemoryTracker(): MemoryTracker {
    return this.memoryTracker;
  }

  public getMemoryType(): MemoryType {
    return this.memoryType;
  }

  public clear(): void {
    this._clear();
  }

  public setPopNull(): void {
    this._popNull = true;
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

let tracker: MemoryTracker;
let valueArray: MyValueArray;
let arrayObject: MyArray;
let arrayValue: Value;
let initialUsedMemory: number;

beforeEach(() => {
  tracker = new MemoryTracker();
  valueArray = new MyValueArray(tracker, 'user');
  initialUsedMemory = tracker.used;
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

it('exposes the memory type', () => {
  expect(valueArray.getMemoryType()).toStrictEqual('user');
});

it('offers an valueArray reference', () => {
  expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue('abc'), arrayValue]);
});

describe('IReadOnlyArray', () => {
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

describe('_set', () => {
  it('allows setting a new item', () => {
    expect(array.set(2, toValue(3))).toStrictEqual(null);
    expect(array.ref).toStrictEqual<Value[]>([toValue(1), toValue(2), toValue(3)]);
  });

  it('allows overriding an item', () => {
    const initialMemory = tracker.used;
    expect(array.set(0, toValue(-1))).toStrictEqual(toValue(1));
    expect(array.ref).toStrictEqual<Value[]>([toValue(-1), toValue(2)]);
    expect(tracker.used).toStrictEqual(initialMemory);
  });

  it('fails with RangeCheckException on invalid index', () => {
    expect(() => array.set(-1, toValue(0))).toThrowError(RangeCheckException);
  });

  describe('handling tracked values', () => {
    let trackedObject: ValueArray;
    let trackedValue: Value;

    beforeEach(() => {
      trackedObject = new ValueArray(tracker, 'user');
      trackedValue = trackedObject.toValue();
      expect(trackedObject.release()).toStrictEqual(true);
      expect(trackedObject.refCount).toStrictEqual(1);
    });

    it('increases value ref', () => {
      expect(array.set(0, trackedValue)).toStrictEqual(toValue(1));
      expect(trackedObject.refCount).toStrictEqual(2);
    });

    it('releases value ref', () => {
      array.set(0, trackedValue);
      expect(array.set(0, toValue(0))).toStrictEqual(trackedValue);
      expect(trackedObject.refCount).toStrictEqual(1);
    });

    it('releases value ref (value is destroyed)', () => {
      array.set(0, trackedValue);
      trackedObject.release();
      expect(array.set(0, toValue(0))).toStrictEqual(null);
      expect(trackedObject.refCount).toStrictEqual(0);
    });
  });
});

describe('removing items', () => {
  let memoryUsedBefore: number;

  beforeEach(() => {
    memoryUsedBefore = tracker.used;
  });

  it('releases memory and tracked values when removing items', () => {
    expect(valueArray.pop()).toStrictEqual(null);
    expect(tracker.used).toBeLessThan(memoryUsedBefore);
    expect(arrayObject.refCount).toStrictEqual(0);
  });

  it('releases memory when removing items', () => {
    arrayValue.tracker?.addValueRef(arrayValue);
    expect(valueArray.pop()).toStrictEqual(arrayValue);
    expect(tracker.used).toBeLessThan(memoryUsedBefore);
    expect(arrayObject.refCount).toStrictEqual(1);
  });

  it('does not release memory if popImpl returns null', () => {
    valueArray.setPopNull();
    expect(valueArray.pop()).toStrictEqual(null);
    expect(tracker.used).toStrictEqual(memoryUsedBefore);
  });

  it('fails after all items were removed', () => {
    valueArray.clear();
    expect(() => valueArray.pop()).toThrowError(InternalException);
  });
});

it('releases memory once disposed', () => {
  expect(valueArray.release()).toStrictEqual(false);
  expect(arrayObject.refCount).toStrictEqual(0);
  expect(tracker.used).toStrictEqual(0);
});

it('offers some', () => {
  expect(valueArray.some((value) => value.type === ValueType.integer && value.integer === 1)).toStrictEqual(true);
  expect(valueArray.some((value) => value.type === ValueType.integer && value.integer === 2)).toStrictEqual(false);
});

describe('splice', () => {
  it('removes values from the array', () => {
    valueArray.splice(3);
    expect(tracker.used).toStrictEqual(initialUsedMemory);
  });

  // it('removes and adds values to the stack (1)', () => {
  //   stack.splice(1, {
  //     type: ValueType.integer,
  //     number: 456
  //   });
  //   expect(stack.ref).toStrictEqual<InternalValue[]>([
  //     {
  //       type: ValueType.integer,
  //       number: 456
  //     },
  //     {
  //       type: ValueType.string,
  //       string: 'abc'
  //     }
  //   ]);
  // });

  // it('removes and adds values to the stack (2)', () => {
  //   stack.splice(2, [
  //     {
  //       type: ValueType.integer,
  //       number: 456
  //     },
  //     {
  //       type: ValueType.string,
  //       string: 'def'
  //     }
  //   ]);
  //   expect(stack.ref).toStrictEqual<InternalValue[]>([
  //     {
  //       type: ValueType.string,
  //       string: 'def'
  //     },
  //     {
  //       type: ValueType.integer,
  //       number: 456
  //     }
  //   ]);
  // });

  // it('fails with StackUnderflow if not enough values', () => {
  //   expect(() => stack.splice(3)).toThrowError(StackUnderflow);
  // });

  // describe('handling of shared objects', () => {
  //   let sharedObject: MyObject;

  //   beforeEach(() => {
  //     sharedObject = new MyObject();
  //     stack.push({
  //       type: ValueType.array,
  //       array: sharedObject
  //     });
  //     sharedObject.release();
  //     expect(sharedObject.refCount).toStrictEqual(1);
  //   });

  //   it('releases on splice', () => {
  //     stack.splice(1);
  //     expect(sharedObject.refCount).toStrictEqual(0);
  //     expect(sharedObject.disposeCalled).toStrictEqual(1);
  //   });

  //   it('does not release if added again (1)', () => {
  //     stack.splice(1, [
  //       {
  //         type: ValueType.array,
  //         array: sharedObject
  //       }
  //     ]);
  //     expect(sharedObject.refCount).toStrictEqual(1);
  //     expect(sharedObject.disposeCalled).toStrictEqual(0);
  //   });
  // });
});

describe('typeguard function', () => {
  it('recognizes a ValueArray', () => {
    expect(() => ValueArray.check(array)).not.toThrowError();
  });

  it('rejects non objects', () => {
    expect(() => ValueArray.check(1)).toThrowError();
  });

  it('rejects null', () => {
    expect(() => ValueArray.check(null)).toThrowError();
  });

  it('rejects other objects', () => {
    expect(() => ValueArray.check(toValue(1))).toThrowError();
  });
});

describe('toValue', () => {
  it('fails on invalid combinations', () => {
    expect(() => array.toValue({ isReadOnly: false, isExecutable: true })).toThrowError();
  });

  it('returns a valid array value (default: isReadOnly & !isExecutable)', () => {
    const value = array.toValue();
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(false);
  });

  it('returns a valid array value (!isReadOnly & !isExecutable)', () => {
    const value = array.toValue({ isReadOnly: false });
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(false);
    expect(value.isExecutable).toStrictEqual(false);
  });

  it('returns a valid array value (!isReadOnly & isExecutable)', () => {
    const value = array.toValue({ isReadOnly: true, isExecutable: true });
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(true);
  });

  it('adds a reference count', () => {
    array.toValue();
    expect(array.refCount).toStrictEqual(2);
  });
});
