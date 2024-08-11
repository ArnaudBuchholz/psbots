import type { ArrayValue, IArray, IValuePermissions, Value } from '@api/index.js';
import { InternalException, isObject, RangeCheckException } from '@sdk/index.js';
import { AbstractValueContainer } from '@core/objects/AbstractValueContainer.js';

const NOT_A_VALUEARRAY = 'Not a ValueArray';
const EMPTY_ARRAY = 'Empty array';

export class ValueArray extends AbstractValueContainer implements IArray {
  static override check(value: unknown): asserts value is AbstractValueContainer {
    if (!isObject(value) || !(value instanceof AbstractValueContainer)) {
      throw new InternalException(NOT_A_VALUEARRAY);
    }
  }

  /** returned value is not addValueRef'ed */
  override toValue({ isReadOnly = true, isExecutable = false }: Partial<IValuePermissions> = {}): ArrayValue {
    if (!isReadOnly && isExecutable) {
      throw new InternalException('Unsupported permissions');
    }
    return this._toValue({ isReadOnly, isExecutable });
  }

  protected pushImpl(value: Value): void {
    this._values.push(value);
  }

  protected popImpl(): Value {
    const value = this.atOrThrow(-1);
    this._values.pop();
    return value;
  }

  // region IArray

  public set(index: number, value: Value): Value | null {
    if (index < 0) {
      throw new RangeCheckException();
    }
    let previousValue = this._values[index] ?? null;
    if (previousValue !== null) {
      if (previousValue.tracker?.releaseValue(previousValue) === false) {
        previousValue = null;
      }
    } else {
      this.memoryTracker.register({
        type: this.memoryType,
        pointers: 1,
        values: 1
      });
    }
    value.tracker?.addValueRef(value);
    this._values[index] = value;
    return previousValue;
  }

  // endregion IArray

  shift(): Value | null {
    const value = this._values.shift();
    if (value === undefined) {
      throw new InternalException(EMPTY_ARRAY);
    }
    if (value.tracker?.releaseValue(value) === false) {
      return null;
    }
    return value;
  }

  unshift(value: Value): void {
    value.tracker?.addValueRef(value);
    this._values.unshift(value);
  }
}
