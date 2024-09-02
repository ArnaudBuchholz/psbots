import { BaseException } from '@sdk/exceptions/BaseException.js';

export class InternalException extends BaseException {
  constructor(
    message: string,
    private _reason?: unknown
  ) {
    super(message);
  }

  get reason(): unknown {
    return this._reason;
  }
}
