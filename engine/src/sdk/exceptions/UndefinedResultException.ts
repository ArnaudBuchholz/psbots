import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Result cannot be represented as a number';

export class UndefinedResultException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
