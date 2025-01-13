import { nullValue } from '@api/index.js';
import type { ArrayValue, IArray, IValuePermissions, MemoryType, Result, Value } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { AbstractValueContainer } from '@core/objects/AbstractValueContainer.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

export class ValueArray extends AbstractValueContainer implements IArray {
  static create(
    memoryTracker: MemoryTracker,
    memoryType: MemoryType,
    initialCapacity: number,
    capacityIncrement: number
  ): Result<ValueArray> {
    return super.createInstance(memoryTracker, memoryType, initialCapacity, capacityIncrement);
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

  protected popImpl(): Value {
    const value = this._values.at(-1) ?? nullValue;
    this._values.pop();
    return value;
  }

  // region IArray

  public set(index: number, value: Value): Result<Value> {
    if (index < 0) {
      return { success: false, exception: 'rangeCheck' };
    }
    let previousValue = this._values[index] ?? nullValue;
    if (previousValue.tracker?.releaseValue(previousValue) === false) {
      previousValue = nullValue;
    }
    const capacityAdjusted = this.increaseCapacityIfNeeded(index + 1);
    if (!capacityAdjusted.success) {
      return capacityAdjusted;
    }
    value.tracker?.addValueRef(value);
    this._values[index] = value;
    return { success: true, value: previousValue };
  }

  // endregion IArray
}
