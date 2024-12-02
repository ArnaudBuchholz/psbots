import type { IDictionary, Result, Value } from '@api/index.js';
import { nullValue } from '@api/index.js';
import { InvalidAccessException } from '@sdk/index';

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
    return { success: false, error: new InvalidAccessException() };
  }

  // endregion IDictionary
}
