import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Operand is of the wrong type';

export class TypeCheckException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
