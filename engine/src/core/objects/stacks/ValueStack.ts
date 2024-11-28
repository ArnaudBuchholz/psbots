import { nullValue, type Value } from '@api/index.js';
import { StackUnderflowException } from '@sdk/index.js';
import { AbstractValueContainer } from '@core/objects/AbstractValueContainer.js';
import type { IStack } from '@sdk/interfaces/IStack';

/** Makes push & pop manipulate the beginning of the array */
export class ValueStack extends AbstractValueContainer implements IStack {
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

  protected popImpl(): Value {
    const value = this.at(0) ?? nullValue;
    this._values.shift();
    return value;
  }
}
