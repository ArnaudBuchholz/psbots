import type { IReadOnlyDictionary, Value } from '@api/index.js';

export class EmptyDictionary implements IReadOnlyDictionary {
  protected constructor() {}

  private static _instance: EmptyDictionary;

  static get instance(): EmptyDictionary {
    this._instance ??= new EmptyDictionary();
    return this._instance;
  }

  // region IReadOnlyDictionary

  get names(): string[] {
    return [];
  }

  lookup(/*name: string*/): Value | null {
    return null;
  }

  // endregion IReadOnlyDictionary
}
