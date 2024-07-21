import type { Value } from '@api/index.js';
import { StackUnderflowException } from '@sdk/index.js';
import { AbstractValueArray } from '@core/objects/AbstractValueArray.js';
import type { IStack } from '@sdk/interfaces/IStack';

/** Makes push & pop manipulate the beginning of the array */
export class ValueStack extends AbstractValueArray implements IStack {
  get top(): Value {
    const value = this._values[0];
    if (value === undefined) {
      throw new StackUnderflowException();
    }
    return value;
  }

  protected pushImpl(value: Value): void {
    this._values.unshift(value);
  }

  protected popImpl(): Value | null {
    if (this._values.length === 0) {
      throw new StackUnderflowException();
    }
    const value = this.at(0);
    this._values.shift();
    return value;
  }
}
