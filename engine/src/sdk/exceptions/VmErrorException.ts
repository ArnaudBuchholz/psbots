import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Virtual memory error';

export class VmErrorException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
