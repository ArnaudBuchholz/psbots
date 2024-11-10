import type { Value, IValueTracker } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { MemorySize } from '@core/MemoryTracker';
import { assert } from '@sdk/index.js';

const getShareableObject = (value: Value): ShareableObject => {
  if (value.type === ValueType.array) {
    return value.array as unknown as ShareableObject;
  }
  if (value.type === ValueType.dictionary) {
    return value.dictionary as unknown as ShareableObject;
  }
  assert(false, 'Invalid value type');
};

export abstract class ShareableObject {
  static size: MemorySize = {
    integers: 1
  } as const;

  private _refCount: number;

  static tracker: IValueTracker = {
    addValueRef(value) {
      getShareableObject(value).addRef();
    },

    releaseValue(value) {
      return getShareableObject(value).release();
    }
  };

  constructor() {
    this._refCount = 1;
  }

  get refCount(): number {
    return this._refCount;
  }

  addRef(): void {
    ++this._refCount;
  }

  release(): boolean {
    const refCount = --this._refCount;
    if (refCount === 0) {
      this._dispose();
      return false;
    }
    assert(refCount > 0, 'Superfluous release');
    return true;
  }

  protected abstract _dispose(): void;
}
