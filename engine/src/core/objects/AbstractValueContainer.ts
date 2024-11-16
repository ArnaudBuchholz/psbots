import type { ArrayValue, IReadOnlyArray, IValuePermissions, MemoryType, Result, Value } from '@api/index.js';
import { nullValue, ValueType } from '@api/index.js';
import { assert, isObject } from '@sdk/index.js';
import { addMemorySize } from '@core/index.js';
import type { MemorySize, MemoryTracker } from '@core/MemoryTracker';
import { ShareableObject } from '@core/objects/ShareableObject.js';

export abstract class AbstractValueContainer extends ShareableObject implements IReadOnlyArray {
  static override readonly size: MemorySize = addMemorySize(ShareableObject.size, {
    pointers: 1
  });

  static is(value: unknown): value is AbstractValueContainer {
    return isObject(value) && !(value instanceof AbstractValueContainer);
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
    assert(isReadOnly && !isExecutable, 'Unsupported permissions');
    return this._toValue({ isReadOnly, isExecutable });
  }

  protected readonly _values: Value[] = [];

  protected constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType
  ) {
    super();
    const isMemoryAvailable = this._memoryTracker.allocate(AbstractValueContainer.size, this._memoryType, this);
    assert(isMemoryAvailable);
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

  at(index: number): Value {
    return this._values[index] ?? nullValue;
  }

  // endregion IReadOnlyArray

  /** puts the value in the right place */
  protected abstract pushImpl(value: Value): Result<void>;

  push(...values: Value[]): Result {
    const isMemoryAvailable = this._memoryTracker.allocate(
      {
        pointers: values.length,
        values: values.length
      },
      this._memoryType,
      this
    );
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    for (const value of values) {
      value.tracker?.addValueRef(value);
      const pushResult = this.pushImpl(value);
      if (!pushResult.success) {
        return pushResult;
      }
    }
    return { success: true, value: undefined };
  }

  /** pops the value from the right place (or return null if none) */
  protected abstract popImpl(): Result<Value>;

  pop(): Result<Value> {
    const popResult = this.popImpl();
    if (!popResult.success) {
      return popResult;
    }
    const { value } = popResult;
    if (value.type !== ValueType.null) {
      this._memoryTracker.release(
        {
          pointers: -1,
          values: -1
        },
        this._memoryType,
        this
      );
      if (value.tracker?.releaseValue(value) === false) {
        return { success: true, value: nullValue };
      }
      return { success: true, value };
    }
    return { success: true, value: nullValue };
  }

  clear(): Result {
    while (this.length > 0) {
      const popResult = this.pop();
      if (!popResult.success) {
        return popResult;
      }
    }
    return { success: true, value: undefined };
  }

  protected _dispose(): void {
    const clearResult = this.clear();
    assert(clearResult);
    this._memoryTracker.release(AbstractValueContainer.size, this._memoryType, this);
  }
}
