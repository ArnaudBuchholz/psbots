import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Virtual memory exceeded';

export class VmOverflowException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
