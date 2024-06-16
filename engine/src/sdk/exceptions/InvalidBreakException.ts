import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'break has been invoked outside of a loop';

export class InvalidBreakException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
