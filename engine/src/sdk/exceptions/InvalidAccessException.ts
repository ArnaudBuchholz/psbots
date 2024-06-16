import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Object is read-only';

export class InvalidAccessException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
