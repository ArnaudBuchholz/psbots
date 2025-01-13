import type { IDictionary, Result, Value } from '@api/index.js';
import { nullValue } from '@api/index.js';
import { assert } from '@sdk/index.js';

export class EmptyDictionary implements IDictionary {
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

  lookup(/*name: string*/): Value {
    return nullValue;
  }

  // endregion IReadOnlyDictionary

  // region IDictionary

  def(name: string, value: Value): Result<Value> {
    assert(!!name);
    assert(!!value);
    return { success: false, exception: 'invalidAccess' };
  }

  // endregion IDictionary
}
