import { BaseException } from '@sdk/exceptions/BaseException.js'

export class InternalException extends BaseException {
  constructor (message: string) {
    super(message)
  }

  // For internal exception, we ignore state stack
  // eslint-disable-next-line accessor-pairs
  override set stack (value: string) {}
}
