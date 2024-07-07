import { ValueType } from '@api/index.js';
import type { ArrayValue, IArray, IValuePermissions, Value } from '@api/index.js';
import { InternalException, RangeCheckException } from '@sdk/exceptions/index.js';
import { AbstractValueArray } from '@core/objects/AbstractValueArray.js';
import { isObject } from '@sdk/checks';
import { ShareableObject } from '@core/objects/ShareableObject.js';

const EMPTY_ARRAY = 'Empty array';
const NOT_A_VALUEARRAY = 'Not a ValueArray';

export class ValueArray extends AbstractValueArray implements IArray {
  static check(value: unknown): asserts value is ValueArray {
    if (!isObject(value) || !(value instanceof ValueArray)) {
      throw new InternalException(NOT_A_VALUEARRAY);
    }
  }

  toValue(permissions: IValuePermissions): ArrayValue {
    if (!permissions.isReadOnly && permissions.isExecutable) {
      throw new InternalException('Unsupported permissions');
    }
    this.addRef();
    return {
      type: ValueType.array,
      ...permissions,
      tracker: ShareableObject.tracker,
      array: this
    } as ArrayValue;
  }

  protected pushImpl(value: Value): void {
    this._values.push(value);
  }

  protected popImpl(): Value {
    const value = this.atOrThrow(-1);
    this._values.pop();
    return value;
  }

  shift(): Value {
    const value = this._values.shift();
    if (value === undefined) {
      throw new InternalException(EMPTY_ARRAY);
    }
    value.tracker?.releaseValue(value);
    return value;
  }

  unshift(value: Value): void {
    value.tracker?.addValueRef(value);
    this._values.unshift(value);
  }

  // region IArray

  set(index: number, value: Value): Value | null {
    if (index < 0) {
      throw new RangeCheckException();
    }
    let previousValue: Value | null = this._values[index] ?? null;
    if (previousValue !== null && previousValue.tracker?.releaseValue(previousValue) === false) {
      previousValue = null;
    }
    value.tracker?.addValueRef(value);
    this._values[index] = value;
    return previousValue;
  }

  // endregion IArray

  some(predicate: (value: Value, index: number) => boolean): boolean {
    return this._values.some(predicate);
  }
}
