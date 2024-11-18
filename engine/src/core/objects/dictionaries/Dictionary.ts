import type { Value, IDictionary, MemoryType, DictionaryValue, IValuePermissions, Result } from '@api/index.js';
import { ValueType, nullValue } from '@api/index.js';
import { addMemorySize } from '@core/MemoryTracker.js';
import type { MemoryPointer, MemoryTracker } from '@core/MemoryTracker.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';
import { assert } from '@sdk/index.js';

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

  private readonly _root: MemoryPointer;
  private readonly _slots: { [key in string]: { value: Value; pointer: MemoryPointer } } = {};

  private constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType
  ) {
    super();
    const isMemoryAvailable = this._memoryTracker.allocate(
      addMemorySize(ShareableObject.size, {
        pointers: 1
      }),
      this._memoryType,
      this
    );
    assert(isMemoryAvailable);
    this._root = isMemoryAvailable.value;
  }

  static create(memoryTracker: MemoryTracker, memoryType: MemoryType): Result<Dictionary> {
    const isMemoryAvailable = memoryTracker.isAvailable(
      addMemorySize(ShareableObject.size, {
        pointers: 1
      }),
      memoryType
    );
    if (!isMemoryAvailable.success) {
      return isMemoryAvailable;
    }
    return {
      success: true,
      value: new Dictionary(memoryTracker, memoryType)
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

  def(name: string, value: Value): Result<Value> {
    let slot = this._slots[name];
    let previousValue = slot?.value ?? nullValue;
    if (slot !== undefined) {
      if (previousValue.tracker?.releaseValue(previousValue) === false) {
        previousValue = nullValue;
      }
      if (value.type === ValueType.null) {
        this._memoryTracker.release(slot.pointer, this);
        delete this._slots[name];
        return { success: true, value: previousValue };
      }
    } else if (value.type !== ValueType.null) {
      const isMemoryAvailableForName = this._memoryTracker.addStringRef(name);
      if (!isMemoryAvailableForName.success) {
        return isMemoryAvailableForName;
      }
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
    value.tracker?.addValueRef(value);
    this._slots[name] = slot!; // should not be undefined
    return { success: true, value: previousValue };
  }

  // endregion IWritableDictionary

  protected _dispose(): void {
    const names = Object.keys(this._slots);
    for (const name of names) {
      this._memoryTracker.releaseString(name);
      const slot = this._slots[name]!;
      slot.value.tracker?.releaseValue(slot.value);
      this._memoryTracker.release(slot.pointer, this);
    }
    this._memoryTracker.release(this._root, this);
  }
}
