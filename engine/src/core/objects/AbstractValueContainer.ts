import type { ArrayValue, IReadOnlyArray, IValuePermissions, MemoryType, Result, Value } from '@api/index.js';
import { nullValue, ValueType } from '@api/index.js';
import { assert, LimitcheckException } from '@sdk/index.js';
import type { MemoryPointer, MemorySize, MemoryTracker } from '@core/MemoryTracker';
import { addMemorySize } from '@core/MemoryTracker';
import { ShareableObject } from '@core/objects/ShareableObject.js';

export abstract class AbstractValueContainer extends ShareableObject implements IReadOnlyArray {
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

  protected readonly _pointers: MemoryPointer[] = [];
  protected readonly _values: Value[] = [];

  protected constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType,
    private readonly _initialCapacity: number,
    private readonly _capacityIncrement = 1
  ) {
    super();
    assert(this._initialCapacity > 0);
    assert(this._capacityIncrement >= 0);
    const isMemoryAvailable = this._memoryTracker.allocate(AbstractValueContainer.getSize(this._initialCapacity), this._memoryType, this);
    assert(isMemoryAvailable);
    this._pointers.push(isMemoryAvailable.value);
  }

  protected static createInstance<T>(memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number): Result<T> {
    assert(initialCapacity > 0);
    assert(capacityIncrement >= 0);
    const isMemoryAvailable = memoryTracker.isAvailable(this.getSize(initialCapacity), memoryType);
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    // Hack to convert the class into its constructor
    const Constructor = this as unknown as new (memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number) => T;
    return {
      success: true,
      value: new Constructor(memoryTracker, memoryType, initialCapacity, capacityIncrement)
    };
  }

  static getSize(capacity: number): MemorySize {
    return addMemorySize(ShareableObject.size, {
      pointers: 1,
      values: capacity,
    });
  }

  protected getIncrementSize(capacity: number): MemorySize {
    return {
      pointers: 1,
      values: capacity,
    };
  }

  protected get memoryTracker(): MemoryTracker {
    return this._memoryTracker;
  }

  protected get memoryType(): MemoryType {
    return this._memoryType;
  }

  /** As memory is possibly fragmented, the only contiguous items are based on the initial capacity */
  get ref(): readonly Value[] {
    return this._values.slice(0, this._initialCapacity);
  }

  // region IReadOnlyArray

  get length(): number {
    return this._values.length;
  }

  at(index: number): Value {
    return this._values[index] ?? nullValue;
  }

  // endregion IReadOnlyArray

  protected get capacity(): number {
    return this._initialCapacity + (this._pointers.length - 1) * this._capacityIncrement;
  }

  protected increaseCapacityIfNeeded(minCapacity: number): Result<undefined> {
    const missingCapacity = minCapacity - this.capacity;
    if (missingCapacity > 0) {
      if (this._capacityIncrement === 0) {
        return { success: false, error: new LimitcheckException() };
      }
      let increments = Math.ceil(missingCapacity / this._capacityIncrement);
      while (increments > 0) {
        const isMemoryAvailable = this._memoryTracker.allocate(this.getIncrementSize(this._capacityIncrement), this._memoryType, this);
        if (!isMemoryAvailable.success) {
          return isMemoryAvailable;
        }
        this._pointers.push(isMemoryAvailable.value);
        --increments;
      }
    }
    return { success: true, value: undefined }
  }

  /** Puts the value in the right place */
  protected abstract pushImpl(value: Value): void;

  private _push(values: Value[]): void {
    for (const value of values) {
      value.tracker?.addValueRef(value);
      this.pushImpl(value);
    }
  }

  /** Returns the new length */
  push(...values: Value[]): Result<number> {
    const capacityAdjusted = this.increaseCapacityIfNeeded(this._values.length + values.length);
    if (!capacityAdjusted.success) {
      return capacityAdjusted;
    }
    this._push(values);
    return { success: true, value: this._values.length };
  }

  /** pops the value from the right place */
  protected abstract popImpl(): Value;

  protected reduceCapacityIfNeeded(maxCapacity = this._values.length) {
    while (this._pointers.length > 1 && this.capacity - this._capacityIncrement >= maxCapacity) {
      const pointer = this._pointers.at(-1)!; // length has been tested
      this._pointers.pop();
      this._memoryTracker.release(pointer, this);
    }
  }

  private _pop(): Value {
    let value = this.popImpl();
    if (value.type !== ValueType.null) {
      if (value.tracker?.releaseValue(value) === false) {
        value = nullValue;
      }
    }
    return value;
  }

  pop(): Value {
    const value = this._pop();
    this.reduceCapacityIfNeeded();
    return value;
  }

  popush(count: number): { success: true, value: number }
  popush(count: number, valueArray: Value[], ...values: Value[]): Result<number>
  popush(count: number, ...values: Value[]): Result<number>
  popush(count: number, valueOrArray?: Value | Value[], ...values: Value[]): Result<number> {
    const { capacity } = this;
    let arrayOfValues: Value[];
    if (Array.isArray(valueOrArray)) {
      arrayOfValues = valueOrArray.concat(values);
    } else if (valueOrArray) {
      arrayOfValues = [valueOrArray].concat(values);
    } else {
      arrayOfValues = [];
    }
    const finalLength = this.length - count + arrayOfValues.length;
    if (finalLength > capacity) {
      const increaseResult = this.increaseCapacityIfNeeded(finalLength);
      if (!increaseResult.success) {
        return increaseResult;
      }
    }
    while (count > 0) {
      this._pop();
      --count;
    }
    this._push(arrayOfValues);
    this.reduceCapacityIfNeeded();
    return { success: true, value: this.length };
  }

  clear(): void {
    while (this.length > 0) {
      this._pop();
    }
    this.reduceCapacityIfNeeded();
  }

  protected _dispose(): void {
    this.clear();
    this._memoryTracker.release(this._pointers[0]!, this);
  }
}
