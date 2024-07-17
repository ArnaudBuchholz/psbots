import type { ArrayValue, IArray, IValuePermissions, MemoryType, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { isObject, InternalException, RangeCheckException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/index.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

const NO_VALUE = 'No value';
const EMPTY_ARRAY = 'Empty array';
const NOT_AN_ABSTRACTVALUEARRAY = 'Not an AbstractValueArray';

export abstract class AbstractValueArray extends ShareableObject implements IArray {
  static check(value: unknown): asserts value is AbstractValueArray {
    if (!isObject(value) || !(value instanceof AbstractValueArray)) {
      throw new InternalException(NOT_AN_ABSTRACTVALUEARRAY);
    }
  }

  toValue({ isReadOnly = true, isExecutable = false }: Partial<IValuePermissions> = {}): ArrayValue {
    if (!isReadOnly && isExecutable) {
      throw new InternalException('Unsupported permissions');
    }
    this.addRef();
    return {
      type: ValueType.array,
      isReadOnly,
      isExecutable,
      tracker: ShareableObject.tracker,
      array: this
    } as ArrayValue;
  }

  protected readonly _values: Value[] = [];

  constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType
  ) {
    super();
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: 1
    });
  }

  protected get memoryTracker(): MemoryTracker {
    return this._memoryTracker;
  }

  protected get memoryType(): MemoryType {
    return this._memoryType;
  }

  get ref(): readonly Value[] {
    return this._values;
  }

  // region IArray

  get length(): number {
    return this._values.length;
  }

  at(index: number): Value | null {
    const value = this._values[index];
    if (value === undefined) {
      return null;
    }
    return value;
  }

  public set(index: number, value: Value): Value | null {
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

  /** puts the value in the right place */
  protected abstract pushImpl(value: Value): void;

  push(...values: Value[]): void {
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: values.length,
      values: values.length
    });
    for (const value of values) {
      value.tracker?.addValueRef(value);
      this.pushImpl(value);
    }
  }

  /** pops the value from the right place (or return null if none) */
  protected abstract popImpl(): Value | null;

  pop(): Value | null {
    const value = this.popImpl();
    if (value !== null) {
      this._memoryTracker.register({
        type: this._memoryType,
        pointers: -1,
        values: -1
      });
      if (value.tracker?.releaseValue(value) === false) {
        return null;
      }
      return value;
    }
    return null;
  }

  protected atOrThrow(index: number): Value {
    const value = this._values.at(index);
    if (value === undefined) {
      throw new InternalException(NO_VALUE);
    }
    return value;
  }

  clear(): void {
    for (const value of this._values) {
      value.tracker?.releaseValue(value);
    }
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: -this._values.length,
      values: -this._values.length
    });
    this._values.length = 0;
  }

  protected _dispose(): void {
    this.clear();
    this._memoryTracker.register({
      type: this._memoryType,
      values: -this._values.length
    });
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: -1
    });
  }

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

  some(predicate: (value: Value, index: number) => boolean): boolean {
    return this._values.some(predicate);
  }

  splice(start: number, deleteCount: number, ...values: Value[]): (Value | null)[] {
    const removedValues = this._values.splice(start, deleteCount, ...values);
    const diff = values.length - removedValues.length;
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: diff,
      values: diff
    });
    for (const value of values) {
      value.tracker?.addValueRef(value);
    }
    return removedValues.map((value) => {
      if (value.tracker?.releaseValue(value) === false) {
        return null;
      }
      return value;
    });
  }
}
