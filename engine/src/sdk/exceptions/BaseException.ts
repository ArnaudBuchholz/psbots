import type { IException, Value } from '@api/index.js';
import { ExceptionDictionaryName, ExceptionType, ValueType } from '@api/index.js';

export class BaseException extends Error implements IException {
  private _engineStack: string[] = [];

  constructor(message: string, name?: string) {
    super(message);
    this.name = name ?? this.constructor.name;
  }

  get type(): ExceptionType {
    return ExceptionType.system;
  }

  get engineStack(): string[] {
    return this._engineStack;
  }

  set engineStack(value: string[]) {
    this._engineStack = [...value];
  }

  // region IReadOnlyDictionary

  get names(): string[] {
    return Object.keys(ExceptionDictionaryName);
  }

  lookup(name: string): Value | null {
    let string: string | undefined;
    if (name === ExceptionDictionaryName.type) {
      string = ExceptionType.system;
    } else if (name === ExceptionDictionaryName.name) {
      string = this.name;
    } else if (name === ExceptionDictionaryName.message) {
      string = this.message;
    } else if (name === ExceptionDictionaryName.stack) {
      string = this.stack;
    }
    if (string !== undefined) {
      return {
        type: ValueType.string,
        isReadOnly: true,
        isExecutable: false,
        string
      };
    }
    return null;
  }

  // endregion IReadOnlyDictionary
}
