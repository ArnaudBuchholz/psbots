import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Execution stopped';

export class StopException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
