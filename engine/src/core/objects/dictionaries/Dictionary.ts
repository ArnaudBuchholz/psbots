import type { Value, IDictionary, MemoryType, DictionaryValue, IValuePermissions, Result } from '@api/index.js';
import { ValueType, nullValue } from '@api/index.js';
import { addMemorySize } from '@core/MemoryTracker.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
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

  private readonly _values: { [key in string]: Value } = {};

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
  }

  static create(memoryTracker: MemoryTracker, memoryType: MemoryType): Result<Dictionary> {
    const isMemoryAvailable = memoryTracker.isAvailable(
      addMemorySize(ShareableObject.size, {
        pointers: 1
      })
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
    return Object.keys(this._values);
  }

  lookup(name: string): Value {
    return this._values[name] ?? nullValue;
  }

  // endregion IReadOnlyDictionary

  // region IDictionary

  def(name: string, value: Value): Result<Value> {
    let previousValue = this._values[name] ?? nullValue;
    if (previousValue !== undefined) {
      if (previousValue.tracker?.releaseValue(previousValue) === false) {
        previousValue = nullValue;
      }
      if (value.type === ValueType.null) {
        this._memoryTracker.release(
          {
            values: -1,
            pointers: -3
          },
          this._memoryType,
          this
        );
        return { success: true, value: previousValue };
      }
    } else if (value.type !== ValueType.null) {
      const isMemoryAvailableForName = this._memoryTracker.addStringRef(name);
      if (!isMemoryAvailableForName.success) {
        return isMemoryAvailableForName;
      }
      const isMemoryAvailableForPlaceholder = this._memoryTracker.allocate(
        {
          values: 1,
          pointers: 3
        },
        this._memoryType,
        this
      );
      if (!isMemoryAvailableForPlaceholder) {
        this._memoryTracker.releaseString(name);
        return isMemoryAvailableForPlaceholder;
      }
    }
    value.tracker?.addValueRef(value);
    this._values[name] = value;
    return { success: true, value: previousValue };
  }

  // endregion IWritableDictionary

  protected _dispose(): void {
    const names = Object.keys(this._values);
    for (const name of names) {
      this._memoryTracker.releaseString(name);
      const value = this._values[name] ?? nullValue;
      value.tracker?.releaseValue(value);
    }
    this._memoryTracker.release(
      {
        values: -names.length,
        pointers: -3 * names.length - 1
      },
      this._memoryType,
      this
    );
  }
}
