import { Value } from '@api/index.js'
import { StackUnderflowException } from '@sdk/exceptions/index.js'
import { AbstractValueArray } from '@core/objects/AbstractValueArray.js';

/** Makes push & pop manipulate the beginning of the array */
export class ValueStack extends AbstractValueArray {
  protected pushImpl (value: Value): void {
    this._values.unshift(value);
  }

  protected popImpl (): Value | null {
    if (this._values.length === 0) {
      throw new StackUnderflowException();
    }
    const value = this.at(0);
    this._values.shift();
    return value;
  }
}
