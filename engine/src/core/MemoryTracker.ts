import type { Value, IValueTracker, IMemoryTracker } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InternalException, VmOverflowException } from '@sdk/index.js';
import type { ShareableObject } from '@core/objects/ShareableObject.js';

export const MEMORY_INTEGER_SIZE = 4;

const stringSizer = (data: string): number => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  return buffer.length + 1; // terminal 0
};

const getShareableObject = (value: Value): ShareableObject => {
  if (value.type === ValueType.operator) {
    return value.operator as unknown as ShareableObject;
  } else if (value.type === ValueType.array) {
    return value.array as unknown as ShareableObject;
  } else if (value.type === ValueType.dictionary) {
    return value.dictionary as unknown as ShareableObject;
  }
  throw new InternalException(`Unexpected tracked value type ${value.type}`);
};

type MemoryTrackerOptions = {
  /** Maximum memory allowed */
  total?: number;
  /** Minimum length for a string to be cached (default: 32) */
  stringCacheThreshold?: number;
};

type MemorySize = {
  bytes?: number;
  integers?: number;
  pointers?: number;
};

const toBytes = (size: number | MemorySize): number => {
  if (typeof size === 'number') {
    return size;
  }
  return (size.bytes ?? 0) + (size.integers ?? 0) * 4 + (size.pointers ?? 0) * 4;
};

export class MemoryTracker implements IValueTracker, IMemoryTracker {
  private readonly _total: number = Infinity;
  private _used: number = 0;
  private _peak: number = 0;

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
        this.increment({
          bytes: size,
          integers: 1
        });
        return;
      }
      ++this._stringsRefCount[pos];
      return;
    }
    this.increment(size);
  }

  private _releaseString(string: string): void {
    const size = stringSizer(string);
    if (string.length >= this._stringCacheThreshold) {
      const pos = this._strings.indexOf(string);
      const refCount = --this._stringsRefCount[pos];
      if (refCount === 0) {
        this.decrement({
          bytes: size,
          integers: 1
        });
      }
      return;
    }
    this.decrement(size);
  }

  increment(size: number | MemorySize): void {
    this._used += toBytes(size);
    if (this._used > this._total) {
      throw new VmOverflowException();
    }
    this._peak = Math.max(this._used, this._peak);
  }

  decrement(size: number | MemorySize): void {
    this._used -= toBytes(size);
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

  // region IValueTracker

  addValueRef(value: Value): void {
    if (value.type === ValueType.string) {
      this._addStringRef(value.string);
    } else {
      getShareableObject(value).addRef();
    }
  }

  releaseValue(value: Value): void {
    if (value.type === ValueType.string) {
      this._releaseString(value.string);
    } else {
      getShareableObject(value).release();
    }
  }

  // endregion IValueTracker
}
