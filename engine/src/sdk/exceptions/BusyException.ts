import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Engine is already busy';

export class BusyException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
