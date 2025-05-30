import type { ArrayValue, IReadOnlyArray, IValuePermissions, MemoryType, Result, Value } from '@api/index.js';
import { nullValue } from '@api/index.js';
import { assert } from '@sdk/index.js';
import type { IGarbageCollectible, MemoryPointer, MemorySize, MemoryTracker } from '@core/MemoryTracker.js';
import { addMemorySize } from '@core/MemoryTracker.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

export abstract class AbstractValueContainer extends ShareableObject implements IReadOnlyArray, IGarbageCollectible {
  protected _toValue({ isReadOnly, isExecutable }: IValuePermissions): ArrayValue {
    return {
      type: 'array',
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
    const isMemoryAvailable = this._memoryTracker.allocate(
      AbstractValueContainer.getSize(this._initialCapacity),
      this._memoryType,
      this
    );
    assert(isMemoryAvailable);
    this._pointers.push(isMemoryAvailable.value);
  }

  protected static createInstance<T>(
    memoryTracker: MemoryTracker,
    memoryType: MemoryType,
    initialCapacity: number,
    capacityIncrement: number
  ): Result<T> {
    assert(initialCapacity > 0);
    assert(capacityIncrement >= 0);
    const isMemoryAvailable = memoryTracker.isAvailable(this.getSize(initialCapacity), memoryType);
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    // Hack to convert the class into its constructor
    const Constructor = this as unknown as new (
      memoryTracker: MemoryTracker,
      memoryType: MemoryType,
      initialCapacity: number,
      capacityIncrement: number
    ) => T;
    return {
      success: true,
      value: new Constructor(memoryTracker, memoryType, initialCapacity, capacityIncrement)
    };
  }

  static getSize(capacity: number): MemorySize {
    return addMemorySize(ShareableObject.size, {
      pointers: 1,
      values: capacity
    });
  }

  protected getIncrementSize(capacity: number): MemorySize {
    return {
      pointers: 1,
      values: capacity
    };
  }

  protected get memoryTracker(): MemoryTracker {
    return this._memoryTracker;
  }

  protected get memoryType(): MemoryType {
    return this._memoryType;
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

  reserve(count: number): Result<undefined> {
    assert(count > 0);
    return this.increaseCapacityIfNeeded(this.capacity + count);
  }

  protected increaseCapacityIfNeeded(minCapacity: number): Result<undefined> {
    const missingCapacity = minCapacity - this.capacity;
    if (missingCapacity > 0) {
      if (this._capacityIncrement === 0) {
        return { success: false, exception: 'limitcheck' };
      }
      let increments = Math.ceil(missingCapacity / this._capacityIncrement);
      while (increments > 0) {
        const isMemoryAvailable = this._memoryTracker.allocate(
          this.getIncrementSize(this._capacityIncrement),
          this._memoryType,
          this
        );
        if (!isMemoryAvailable.success) {
          return isMemoryAvailable;
        }
        this._pointers.push(isMemoryAvailable.value);
        --increments;
      }
    }
    return { success: true, value: undefined };
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

  private _inGarbageCollector = false;

  public collectGarbage(): boolean {
    if (this._pointers.length > 1 && this.capacity - this._capacityIncrement >= this._values.length) {
      const pointer = this._pointers.at(-1)!; // length has been tested
      this._pointers.pop();
      this._memoryTracker.release(pointer, this);
      return true;
    }
    if (this._disposed) {
      this._memoryTracker.release(this._pointers[0]!, this);
    }
    this._inGarbageCollector = false;
    return false;
  }

  protected reduceCapacityIfNeeded() {
    if (this._memoryTracker.experimentalGarbageCollector) {
      if (!this._inGarbageCollector) {
        this._memoryTracker.addToGarbageCollectorQueue(this);
        this._inGarbageCollector = true;
      }
    } else {
      while (this.collectGarbage()) {
        // do nothing
      }
    }
  }

  private _pop(): Value {
    let value = this.popImpl();
    if (value.type !== 'null' && value.tracker?.releaseValue(value) === false) {
      value = nullValue;
    }
    return value;
  }

  pop(): Value {
    const value = this._pop();
    this.reduceCapacityIfNeeded();
    return value;
  }

  swap(indexA: number, indexB: number): void {
    assert(indexA >= 0 && indexA < this.length && indexB >= 0 && indexB < this.length);
    const valueA = this.at(indexA);
    this._values[indexA] = this.at(indexB);
    this._values[indexB] = valueA;
  }

  popush(count: number): { success: true; value: number };
  popush(count: number, valueArray: Value[], ...values: Value[]): Result<number>;
  popush(count: number, ...values: Value[]): Result<number>;
  popush(count: number, valueOrArray?: Value | Value[], ...values: Value[]): Result<number> {
    const { capacity } = this;
    let arrayOfValues: Value[];
    if (Array.isArray(valueOrArray)) {
      arrayOfValues = [...valueOrArray, ...values];
    } else if (valueOrArray) {
      arrayOfValues = [valueOrArray, ...values];
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

  private _disposed = false;

  protected _dispose(): void {
    this.clear();
    this._disposed = true;
    if (!this._memoryTracker.experimentalGarbageCollector) {
      this._memoryTracker.release(this._pointers[0]!, this);
    }
  }
}
