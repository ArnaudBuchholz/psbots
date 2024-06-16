import { BaseException } from '@sdk/exceptions/BaseException.js';

const MESSAGE = 'Unmatched mark in the operand stack';

export class UnmatchedMarkException extends BaseException {
  constructor() {
    super(MESSAGE);
  }
}
