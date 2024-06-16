import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'No custom dictionary left to unstack';

export class DictStackUnderflowException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
