import type { ArrayValue, IReadOnlyArray, IValuePermissions, MemoryType, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { isObject, InternalException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/index.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

const NO_VALUE = 'No value';
const NOT_AN_ABSTRACTVALUECONTAINER = 'Not an AbstractValueContainer';

export abstract class AbstractValueContainer extends ShareableObject implements IReadOnlyArray {
  static check(value: unknown): asserts value is AbstractValueContainer {
    if (!isObject(value) || !(value instanceof AbstractValueContainer)) {
      throw new InternalException(NOT_AN_ABSTRACTVALUECONTAINER);
    }
  }

  protected _toValue({ isReadOnly, isExecutable }: IValuePermissions): ArrayValue {
    return {
      type: ValueType.array,
      isReadOnly,
      isExecutable,
      tracker: ShareableObject.tracker,
      array: this
    } as ArrayValue;
  }

  /** returned value is not addValueRef'ed */
  toValue({ isReadOnly = true, isExecutable = false }: Partial<IValuePermissions> = {}): ArrayValue {
    if (!isReadOnly || isExecutable) {
      throw new InternalException('Unsupported permissions');
    }
    return this._toValue({ isReadOnly, isExecutable });
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

  // region IReadOnlyArray

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

  // endregion IReadOnlyArray

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
    while (this.length > 0) {
      this.pop();
    }
  }

  protected _dispose(): void {
    this.clear();
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: -1
    });
  }
}
