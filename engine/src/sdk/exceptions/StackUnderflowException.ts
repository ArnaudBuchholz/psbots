import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Not enough operands on the stack to perform the operation';

export class StackUnderflowException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
