import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Name is not defined in the dictionary stack';

export class UndefinedException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
