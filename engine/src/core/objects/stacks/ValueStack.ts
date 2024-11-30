import type { MemoryType, Value } from '@api/index.js';
import { nullValue, Result } from '@api/index.js';
import { StackUnderflowException } from '@sdk/index.js';
import { AbstractValueContainer } from '@core/objects/AbstractValueContainer.js';
import type { IStack } from '@sdk/interfaces/IStack';
import { MemoryTracker } from '@core/MemoryTracker.js';

/** Makes push & pop manipulate the beginning of the array */
export class ValueStack extends AbstractValueContainer implements IStack {
  static create(memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number): Result<ValueStack> {
    return super.createInstance(memoryTracker, memoryType, initialCapacity, capacityIncrement)
  }

  get top(): Result<Value> {
    const value = this._values[0];
    if (value === undefined) {
      return { success: false, error: new StackUnderflowException() };
    }
    return { success: true, value };
  }

  protected pushImpl(value: Value): void {
    this._values.unshift(value);
  }

  protected popImpl(): Value {
    const value = this.at(0) ?? nullValue;
    this._values.shift();
    return value;
  }
}
