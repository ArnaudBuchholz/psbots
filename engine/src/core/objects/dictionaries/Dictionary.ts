import type { Value, IDictionary, MemoryType, DictionaryValue, IValuePermissions } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';
import { InternalException } from '@sdk/index.js';

export class Dictionary extends ShareableObject implements IDictionary {
  /** returned value is not addValueRef'ed */
  toValue({ isReadOnly = true, isExecutable }: Partial<IValuePermissions> = {}): DictionaryValue {
    if (isExecutable === true) {
      throw new InternalException('Unsupported permissions');
    }
    return {
      type: ValueType.dictionary,
      isReadOnly,
      isExecutable: false,
      tracker: ShareableObject.tracker,
      dictionary: this
    } as DictionaryValue;
  }

  private readonly _values: { [key in string]: Value } = {};

  constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType
  ) {
    super();
    this._memoryTracker.register({
      container: this,
      pointers: 1,
      type: this._memoryType
    });
  }

  // region IReadOnlyDictionary

  get names(): string[] {
    return Object.keys(this._values);
  }

  lookup(name: string): Value | null {
    return this._values[name] ?? null;
  }

  // endregion IReadOnlyDictionary

  // region IDictionary

  def(name: string, value: Value): Value | null {
    let previousValue = this._values[name] ?? null;
    if (previousValue !== null) {
      if (previousValue.tracker?.releaseValue(previousValue) === false) {
        previousValue = null;
      }
    } else {
      this._memoryTracker.addValueRef({
        type: ValueType.string,
        isExecutable: false,
        isReadOnly: true,
        string: name
      });
      this._memoryTracker.register({
        container: this,
        values: 1,
        pointers: 3,
        type: this._memoryType
      });
    }
    value.tracker?.addValueRef(value);
    this._values[name] = value;
    return previousValue;
  }

  // endregion IWritableDictionary

  protected _dispose(): void {
    const names = Object.keys(this._values);
    for (const name of names) {
      this._memoryTracker.releaseValue({
        type: ValueType.string,
        isExecutable: false,
        isReadOnly: true,
        string: name
      });
      const value = this._values[name];
      value?.tracker?.releaseValue(value);
    }
    this._memoryTracker.register({
      container: this,
      values: -names.length,
      pointers: -3 * names.length - 1,
      type: this._memoryType
    });
  }
}
