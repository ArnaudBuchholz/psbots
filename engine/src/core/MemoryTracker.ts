import type { Value, IValueTracker, IMemoryTracker, OperatorValue } from '@api/index.js';
import { VmOverflowException, checkStringValue } from '@sdk/index.js';
import type { ShareableObject } from '@core/objects/ShareableObject.js';

const stringSizer = (data: string): number => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  return buffer.length + 1; // terminal 0
};

type MemoryTrackerOptions = {
  /** Maximum memory allowed */
  total?: number;
  /** Minimum length for a string to be cached (default: 32) */
  stringCacheThreshold?: number;
};

type MemoryByType = {
  system: number;
  user: number;
  string: number;
};

type MemoryType = keyof MemoryByType;

type MemoryRegistrationDetails = {
  type: MemoryType;
  bytes?: number;
  integers?: number;
  pointers?: number;
  values?: number;
};

export const OperatorValueTracker: IValueTracker = {
  addValueRef(value: Value) {
    const { operator } = value as OperatorValue;
    (operator as unknown as ShareableObject).addRef();
  },

  releaseValue(value: Value) {
    const { operator } = value as OperatorValue;
    (operator as unknown as ShareableObject).release();
  }
};

export class MemoryTracker implements IValueTracker, IMemoryTracker {
  private readonly _total: number = Infinity;
  private _used: number = 0;
  private _peak: number = 0;
  private _byType: MemoryByType = {
    system: 0,
    user: 0,
    string: 0
  };

  constructor(options: MemoryTrackerOptions = {}) {
    const { total = Infinity, stringCacheThreshold = 32 } = options;
    this._total = total;
    this._stringCacheThreshold = stringCacheThreshold;
  }

  private readonly _stringCacheThreshold: number;
  private readonly _strings: string[] = [];
  private readonly _stringsRefCount: number[] = [];

  private _addStringRef(string: string): void {
    const size = stringSizer(string);
    if (string.length >= this._stringCacheThreshold) {
      const pos = this._strings.indexOf(string);
      if (pos === -1) {
        this._strings.push(string);
        this._stringsRefCount.push(1);
        this.register({
          type: 'string',
          bytes: size,
          integers: 1
        });
        return;
      }
      ++this._stringsRefCount[pos];
      return;
    }
    this.register({
      type: 'string',
      bytes: size
    });
  }

  private _releaseString(string: string): void {
    const size = stringSizer(string);
    if (string.length >= this._stringCacheThreshold) {
      const pos = this._strings.indexOf(string);
      const refCount = --this._stringsRefCount[pos];
      if (refCount === 0) {
        this.register({
          type: 'string',
          bytes: -size,
          integers: -1
        });
      }
      return;
    }
    this.register({
      type: 'string',
      bytes: -size
    });
  }

  register({ type, bytes = 0, integers = 0, pointers = 0, values = 0 }: MemoryRegistrationDetails) {
    const step = bytes + integers * 4 + pointers * 4 + values * 32;
    this._byType[type] += step;
    this._used += step;
    if (this._used > this._total) {
      throw new VmOverflowException();
    }
    this._peak = Math.max(this._used, this._peak);
  }

  // region IMemoryTracker

  get used(): number {
    return this._used;
  }

  get peak(): number {
    return this._peak;
  }

  get total(): number {
    return this._total;
  }

  // endregion

  // region IValueTracker (for string)

  addValueRef(value: Value): void {
    checkStringValue(value);
    this._addStringRef(value.string);
  }

  releaseValue(value: Value): void {
    checkStringValue(value);
    this._releaseString(value.string);
  }

  // endregion IValueTracker (for string)
}