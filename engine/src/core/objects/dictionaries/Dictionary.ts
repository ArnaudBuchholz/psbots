import type { Value, IDictionary, MemoryType, DictionaryValue, IValuePermissions, Result } from '@api/index.js';
import { ValueType, nullValue } from '@api/index.js';
import { addMemorySize } from '@core/MemoryTracker.js';
import type { MemoryPointer, MemorySize, MemoryTracker } from '@core/MemoryTracker.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';
import { assert } from '@sdk/index.js';

/**
 * IDictionary implementation
 * 
 * NOTE about memory management :
 * When the dictionary is created with an initial capacity but the initial keys are removed afterward,
 * the allocated memory is not freed or reclaimed. It will be released only when the object is destroyed.
 */
export class Dictionary extends ShareableObject implements IDictionary {
  /** returned value is not addValueRef'ed */
  toValue({ isReadOnly = true, isExecutable }: Partial<IValuePermissions> = {}): DictionaryValue {
    assert(isExecutable !== true, 'Unsupported permissions');
    return {
      type: ValueType.dictionary,
      isReadOnly,
      isExecutable: false,
      tracker: ShareableObject.tracker,
      dictionary: this
    } as DictionaryValue;
  }

  private readonly _pointer: MemoryPointer;
  private readonly _slots: { [key in string]: { value: Value; pointer: MemoryPointer } } = {};

  private constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType,
    private readonly _initialCapacity: number
  ) {
    super();
    const isMemoryAvailable = this._memoryTracker.allocate(
      Dictionary.getSize(this._initialCapacity),
      this._memoryType,
      this
    );
    assert(isMemoryAvailable);
    this._pointer = isMemoryAvailable.value;
  }

  static getSize(initialKeyCount: number): MemorySize {
    return addMemorySize(ShareableObject.size, {
      pointers: 1 + initialKeyCount,
      values: initialKeyCount,
    });
  }

  static create(memoryTracker: MemoryTracker, memoryType: MemoryType, initialKeyCount: number): Result<Dictionary> {
    const isMemoryAvailable = memoryTracker.isAvailable(Dictionary.getSize(initialKeyCount),memoryType);
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    return {
      success: true,
      value: new Dictionary(memoryTracker, memoryType, initialKeyCount)
    };
  }

  // region IReadOnlyDictionary

  get names(): string[] {
    return Object.keys(this._slots);
  }

  lookup(name: string): Value {
    return this._slots[name]?.value ?? nullValue;
  }

  // endregion IReadOnlyDictionary

  // region IDictionary

  private _checkCapacityUsage() {
    let capacity: number = 0;
    for (const slot of Object.values(this._slots)) {
      if (slot.pointer === this._pointer) {
        ++capacity;
      }
    }
    return capacity;
  }

  def(name: string, value: Value): Result<Value> {
    let slot = this._slots[name];
    let previousValue = slot?.value ?? nullValue;
    if (slot !== undefined) {
      if (previousValue.tracker?.releaseValue(previousValue) === false) {
        previousValue = nullValue;
      }
      if (value.type === ValueType.null) {
        if (slot.pointer !== this._pointer) {
          this._memoryTracker.release(slot.pointer, this);
        }
        delete this._slots[name];
        return { success: true, value: previousValue };
      }
    } else if (value.type !== ValueType.null) {
      const isMemoryAvailableForName = this._memoryTracker.addStringRef(name);
      if (!isMemoryAvailableForName.success) {
        return isMemoryAvailableForName;
      }
      if (this._checkCapacityUsage() < this._initialCapacity) {
        slot = {
          value: nullValue,
          pointer: this._pointer
        };
      } else {
        const isMemoryAvailableForSlot = this._memoryTracker.allocate(
          {
            values: 1,
            pointers: 3
          },
          this._memoryType,
          this
        );
        if (!isMemoryAvailableForSlot.success) {
          this._memoryTracker.releaseString(name);
          return isMemoryAvailableForSlot;
        }
        slot = {
          value: nullValue,
          pointer: isMemoryAvailableForSlot.value
        };
      }
    }
    assert(slot !== undefined);
    slot.value = value;
    value.tracker?.addValueRef(value);
    this._slots[name] = slot; // should not be undefined
    return { success: true, value: previousValue };
  }

  // endregion IWritableDictionary

  protected _dispose(): void {
    for (const [name, slot] of Object.entries(this._slots)) {
      this._memoryTracker.releaseString(name);
      slot.value.tracker?.releaseValue(slot.value);
      if (slot.pointer !== this._pointer) {
        this._memoryTracker.release(slot.pointer, this);
      }
    }
    this._memoryTracker.release(this._pointer, this);
  }
}
