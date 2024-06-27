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
