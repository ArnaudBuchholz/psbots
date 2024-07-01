import type { Value, IValueTracker } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InternalException } from '@sdk/index.js';

const INVALID_VALUE_TYPE = 'Invalid value type';
const TOOMANY_RELEASE = 'Superfluous release';

const getShareableObject = (value: Value): ShareableObject => {
  if (value.type === ValueType.array) {
    return value.array as unknown as ShareableObject;
  }
  if (value.type === ValueType.dictionary) {
    return value.dictionary as unknown as ShareableObject;
  }
  throw new InternalException(INVALID_VALUE_TYPE);
};

export abstract class ShareableObject {
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
    // Stryker disable next-line EqualityOperator
    else if (refCount < 0) {
      throw new InternalException(TOOMANY_RELEASE);
    }
    return true;
  }

  protected abstract _dispose(): void;
}
