import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Operand is too big or too small';

export class RangeCheckException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
