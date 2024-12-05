import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'An implementation limit has been exceeded';

export class LimitcheckException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
