import type { IReadOnlyArray, MemoryType, Value } from '@api/index.js';
import { InternalException } from '@sdk/exceptions/index.js';
import type { MemoryTracker } from '@core/index.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

const NO_VALUE = 'No value';

export abstract class AbstractValueArray extends ShareableObject implements IReadOnlyArray {
  protected readonly _values: Value[] = [];

  constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _memoryType: MemoryType
  ) {
    super();
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: 1
    });
  }

  // region IReadOnlyArray

  get length(): number {
    return this._values.length;
  }

  at(index: number): Value | null {
    const value = this._values[index];
    if (value === undefined) {
      return null;
    }
    return value;
  }

  // endregion IReadOnlyArray

  protected get memoryTracker(): MemoryTracker {
    return this._memoryTracker;
  }

  protected get memoryType(): MemoryType {
    return this._memoryType;
  }

  /** puts the value in the right place */
  protected abstract pushImpl(value: Value): void;

  push(value: Value): void {
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: 1,
      values: 1
    });
    value.tracker?.addValueRef(value);
    this.pushImpl(value);
  }

  /** pops the value from the right place (or return null if none) */
  protected abstract popImpl(): Value | null;

  pop(): Value | null {
    const value = this.popImpl();
    if (value !== null) {
      this._memoryTracker.register({
        type: this._memoryType,
        pointers: -1,
        values: -1
      });
      if (value.tracker?.releaseValue(value) === false) {
        return null;
      }
      return value;
    }
    return null;
  }

  protected atOrThrow(index: number): Value {
    const value = this._values.at(index);
    if (value === undefined) {
      throw new InternalException(NO_VALUE);
    }
    return value;
  }

  get ref(): readonly Value[] {
    return this._values;
  }

  protected _clear(): void {
    for (const value of this._values) {
      value.tracker?.releaseValue(value);
    }
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: -this._values.length,
      values: -this._values.length
    });
    this._values.length = 0;
  }

  protected _dispose(): void {
    this._clear();
    this._memoryTracker.register({
      type: this._memoryType,
      values: -this._values.length
    });
    this._memoryTracker.register({
      type: this._memoryType,
      pointers: -1
    });
  }
}
