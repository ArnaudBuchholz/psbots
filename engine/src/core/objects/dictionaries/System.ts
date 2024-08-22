import { ValueType } from '@api/index.js';
import type { IReadOnlyDictionary, Value } from '@api/index.js';

export class SystemDictionary implements IReadOnlyDictionary {
  protected constructor() {}

  private static _instance: SystemDictionary;

  static get instance(): SystemDictionary {
    this._instance ??= new SystemDictionary();
    return this._instance;
  }

  // region IReadOnlyDictionary

  get names(): string[] {
    return ['mark'];
  }

  lookup(name: string): Value | null {
    if (name === 'mark') {
      return {
        type: ValueType.mark,
        isExecutable: false,
        isReadOnly: true
      };
    }
    return null;
  }

  // endregion IReadOnlyDictionary
}
