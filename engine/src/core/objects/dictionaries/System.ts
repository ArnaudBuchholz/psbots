import type { IReadOnlyDictionary, Value } from '@api/index.js';
import { registry } from '@core/operators/index.js';

export class SystemDictionary implements IReadOnlyDictionary {
  protected constructor() {}

  private static _instance: SystemDictionary;

  static get instance(): SystemDictionary {
    this._instance ??= new SystemDictionary();
    return this._instance;
  }

  // region IReadOnlyDictionary

  get names(): string[] {
    return Object.keys(registry).filter((name) => !registry[name]?.definition.internal);
  }

  lookup(name: string): Value | null {
    const operator = registry[name];
    if (operator !== undefined && !operator.definition.internal) {
      return operator.value;
    }
    return null;
  }

  // endregion IReadOnlyDictionary
}
