import type { Value, IValueTracker, IMemoryTracker } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InternalException, VmOverflowException } from '@sdk/index.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

export const MEMORY_INTEGER_SIZE = 4;

const stringSizer = (data: string): number => {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  return buffer.length + 1 // terminal 0
};

const getShareableObject = (value: Value): ShareableObject => {
  if (value.type === ValueType.operator) {
    return value.operator as unknown as ShareableObject;
  } else if (value.type === ValueType.array) {
    return value.array as unknown as ShareableObject;
  } else if (value.type === ValueType.dictionary) {
    return value.dictionary as unknown as ShareableObject;
  }
  throw new InternalException(`Unexpected tracked value type ${value.type}`)
}

type MemoryTrackerOptions = {
  /** Maximum memory allowed */
  total?: number;
  /** Pointer size (default: 4 bytes) */
  pointerSize?: number;
  /** Minimum length for a string to be cached (default: 32) */
  cachableStringLength?: number;
};

export class MemoryTracker implements IValueTracker, IMemoryTracker {
  private readonly _total: number = Infinity;
  private _used: number = 0;
  private _peak: number = 0;

  private readonly _pointerSize: number;

  constructor (options: MemoryTrackerOptions = {}) {
    const {
      total = Infinity,
      pointerSize = 4,
      cachableStringLength = 32
    } = options;
    this._total = total;
    this._pointerSize = pointerSize;
    this._cachableStringLength = cachableStringLength;
  }

  private readonly _cachableStringLength: number;
  private readonly _strings: string[] = []
  private readonly _stringsRefCount: number[] = []

  private _addStringRef (string: string): number {
    const size = stringSizer(string);
    if (string.length >= this._cachableStringLength) {
      const pos = this._strings.indexOf(string);
      if (pos === -1) {
        this._strings.push(string);
        this._stringsRefCount.push(1);
        return size + MEMORY_INTEGER_SIZE;
      }
      ++this._stringsRefCount[pos];
      return 0;
    }
    return size;
  }

  private _releaseString (string: string): number {
    const size = stringSizer(string);
    if (string.length >= this._cachableStringLength) {
      const pos = this._strings.indexOf(string);
      const refCount = --this._stringsRefCount[pos];
      if (refCount === 0) {
        return size + MEMORY_INTEGER_SIZE;
      }
      return 0;
    }
    return size;
  }

  increment (bytes: number): void {
    this._used += bytes
    if (this._used > this._total) {
      throw new VmOverflowException()
    }
    this._peak = Math.max(this._used, this._peak)
  }

  decrement (bytes: number): void {
    this._used -= bytes
  }

  // region IMemoryTracker

  get used (): number {
    return this._used
  }

  get peak (): number {
    return this._peak
  }

  get total (): number {
    return this._total
  }

  // endregion

  // region IValueTracker

  addValueRef (value: Value): void {
    if (value.type === ValueType.string) {
      this._addStringRef(value.string);
    } else {
      getShareableObject(value).addRef();
    }
  }

  releaseValue (value: Value): void {
    if (value.type === ValueType.string) {
      this._releaseString(value.string);
    } else {
      getShareableObject(value).release();
    }
  }

  // endregion IValueTracker
}
