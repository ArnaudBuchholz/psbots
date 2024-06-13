import type { IException, Value } from '@api/index.js'
import { ExceptionDictionaryName, ExceptionType, ValueType } from '@api/index.js'

export class BaseException extends Error implements IException {
  private _stack: string = ''
  
  constructor (message: string, name?: string) {
    super(message)
    this.name = name ?? this.constructor.name
    this._stack = super.stack ?? ''
  }

  get type () {
    return ExceptionType.system
  }

  override get stack (): string {
    return this._stack
  }

  override set stack (value: string) {
    this._stack = value
  }
  
  // region IReadOnlyDictionary
  
  get names (): string[] {
    return Object.keys(ExceptionDictionaryName)
  }
  
  lookup (name: string): Value | null {
    let string: string | undefined
    if (name === ExceptionDictionaryName.type) {
      string = ExceptionType.system
    } else if (name === ExceptionDictionaryName.name) {
      string = this.name
    } else if (name === ExceptionDictionaryName.message) {
      string = this.message
    } else if (name === ExceptionDictionaryName.stack) {
      string = this.stack
    }
    if (string !== undefined) {
      return {
        type: ValueType.string,
        isReadOnly: true,
        isExecutable: false,
        isShared: false,
        string
      }
    }
    return null
  }
  
  // endregion IReadOnlyDictionary
}
