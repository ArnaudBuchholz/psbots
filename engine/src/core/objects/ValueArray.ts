import type { Value } from '@api/index.js';
import { AbstractValueArray } from '@core/objects/AbstractValueArray.js';

export class ValueArray extends AbstractValueArray {
  protected pushImpl(value: Value): void {
    this._values.push(value);
  }

  protected popImpl(): Value {
    const value = this.atOrThrow(-1);
    this._values.pop();
    return value;
  }
}
