import type { ArrayValue, IReadOnlyArray, IValuePermissions, MemoryType, Result, Value } from '@api/index.js';
import { nullValue, ValueType } from '@api/index.js';
import { assert } from '@sdk/index.js';
import { addMemorySize } from '@core/index.js';
import type { MemoryPointer, MemorySize, MemoryTracker } from '@core/MemoryTracker';
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
    const isMemoryAvailable = this._memoryTracker.allocate(AbstractValueContainer.getSize(this._initialCapacity), this._memoryType, this);
    assert(isMemoryAvailable);
    this._pointers.push(isMemoryAvailable.value);
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

  protected get currentCapacity(): number {
    return this._initialCapacity + (this._pointers.length - 1) * this._capacityIncrement;
  }

  /** Puts the value in the right place */
  protected abstract pushImpl(value: Value): void;

  /** Returns the new length property of the object upon which the method was called */
  push(...values: Value[]): Result<number> {
    const missingCapacity = this._values.length + values.length - this.currentCapacity;
    if (missingCapacity > 0) {
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
    for (const value of values) {
      value.tracker?.addValueRef(value);
      this.pushImpl(value);
    }
    return { success: true, value: this._values.length };
  }

  /** pops the value from the right place */
  protected abstract popImpl(): Value;

  pop(): Value {
    let value = this.popImpl();
    if (value.type !== ValueType.null) {
      if (value.tracker?.releaseValue(value) === false) {
        value = nullValue;
      }
    }
    if (this._pointers.length > 1 && this.currentCapacity - this._capacityIncrement >= this._values.length) {
      const pointer = this._pointers.at(-1)!; // length has been tested
      this._pointers.pop();
      this._memoryTracker.release(pointer, this);
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
    this._memoryTracker.release(this._pointers[0]!, this);
  }
}
