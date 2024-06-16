import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Loop break';

export class BreakException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
