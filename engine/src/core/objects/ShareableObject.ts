import { InternalException } from '@sdk/index.js';

const TOOMANY_RELEASE = 'Superfluous release';

export abstract class ShareableObject {
  private _refCount: number;

  constructor() {
    this._refCount = 1;
  }

  get refCount(): number {
    return this._refCount;
  }

  addRef(): void {
    ++this._refCount;
  }

  release(): void {
    const refCount = --this._refCount;
    if (refCount === 0) {
      this._dispose();
    }
    // Stryker disable next-line EqualityOperator
    else if (refCount < 0) {
      throw new InternalException(TOOMANY_RELEASE);
    }
  }

  protected abstract _dispose(): void;
}
