import { nullValue } from '@api/index.js';
import type { ArrayValue, IArray, IValuePermissions, MemoryType, Result, Value } from '@api/index.js';
import { assert, RangeCheckException } from '@sdk/index.js';
import { AbstractValueContainer } from '@core/objects/AbstractValueContainer.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

export class ValueArray extends AbstractValueContainer implements IArray {
  static create(memoryTracker: MemoryTracker, memoryType: MemoryType): Result<ValueArray> {
    const isMemoryAvailable = memoryTracker.isAvailable(ValueArray.size);
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    return {
      success: true,
      value: new ValueArray(memoryTracker, memoryType)
    };
  }

  /** returned value is not addValueRef'ed */
  override toValue({ isReadOnly = true, isExecutable = false }: Partial<IValuePermissions> = {}): ArrayValue {
    assert(isReadOnly || !isExecutable, 'Unsupported permissions');
    return this._toValue({ isReadOnly, isExecutable });
  }

  protected pushImpl(value: Value): Result {
    this._values.push(value);
    return { success: true, value: undefined };
  }

  protected popImpl(): Result<Value> {
    const value = this.at(-1);
    this._values.pop();
    return { success: true, value };
  }

  // region IArray

  public set(index: number, value: Value): Result<Value> {
    if (index < 0) {
      return { success: false, error: new RangeCheckException() };
    }
    let previousValue = this._values[index] ?? nullValue;
    if (previousValue !== null) {
      if (previousValue.tracker?.releaseValue(previousValue) === false) {
        previousValue = nullValue;
      }
    } else {
      const isMemoryAvailable = this.memoryTracker.allocate(
        {
          pointers: 1,
          values: 1
        },
        this.memoryType,
        this
      );
      if (!isMemoryAvailable) {
        return isMemoryAvailable;
      }
    }
    value.tracker?.addValueRef(value);
    this._values[index] = value;
    return { success: true, value: previousValue };
  }

  // endregion IArray

  shift(): Value {
    const value = this._values.shift();
    assert(value !== undefined, 'Empty array');
    this.memoryTracker.release(
      {
        pointers: -1,
        values: -1
      },
      this.memoryType,
      this
    );
    if (value.tracker?.releaseValue(value) === false) {
      return nullValue;
    }
    return value;
  }

  unshift(value: Value): Result {
    const isMemoryAvailable = this.memoryTracker.allocate(
      {
        pointers: 1,
        values: 1
      },
      this.memoryType,
      this
    );
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    value.tracker?.addValueRef(value);
    this._values.unshift(value);
    return { success: true, value: undefined };
  }
}
