import type { Value, IValueTracker } from '@api/index.js';
import { assert } from '@sdk/index.js';
import type { MemorySize } from '@core/MemoryTracker.js';

const getShareableObject = (value: Value): ShareableObject => {
  if (value.type === 'array') {
    return value.array as unknown as ShareableObject;
  }
  if (value.type === 'dictionary') {
    return value.dictionary as unknown as ShareableObject;
  }
  assert(false, 'Invalid value type');
};

export abstract class ShareableObject {
  static readonly size: MemorySize = {
    integers: 1
  } as const;

  private _refCount: number = 1;

  static readonly tracker: IValueTracker = {
    addValueRef(value) {
      getShareableObject(value).addRef();
    },

    releaseValue(value) {
      return getShareableObject(value).release();
    }
  };

  constructor() {}

  get refCount(): number {
    return this._refCount;
  }

  addRef(): void {
    ++this._refCount;
  }

  release(): boolean {
    const referenceCount = --this._refCount;
    if (referenceCount === 0) {
      this._dispose();
      return false;
    }
    assert(referenceCount > 0, 'Superfluous release');
    return true;
  }

  /** Should not fail */
  protected abstract _dispose(): void;
}
