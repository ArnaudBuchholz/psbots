import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IOperandStack } from '@sdk/index.js';
import { StackUnderflowException, TypeCheckException, UnmatchedMarkException } from '@sdk/index.js';
import { ValueStack } from './ValueStack.js';

export class OperandStack extends ValueStack implements IOperandStack {
  // region IOperandStack

  check<T extends ValueType>(type: T | null): readonly [Value<T>];
  check<T1 extends ValueType, T2 extends ValueType>(
    type1: T1 | null,
    type2: T2 | null
  ): readonly [Value<T1>, Value<T2>];
  check<T1 extends ValueType, T2 extends ValueType, T3 extends ValueType>(
    type1: T1 | null,
    type2: T2 | null,
    type3: T3 | null
  ): readonly [Value<T1>, Value<T2>, Value<T3>];
  check(...types: Array<ValueType | null>): readonly Value[] {
    if (types.length > this._values.length) {
      throw new StackUnderflowException();
    }
    return types.map((type: ValueType | null, pos: number) => {
      const value = this.atOrThrow(pos);
      if (type !== null && value.type !== type) {
        throw new TypeCheckException();
      }
      return value;
    });
  }

  findMarkPos(): number {
    const pos = this._values.findIndex((value) => value.type === ValueType.mark);
    if (pos === -1) {
      throw new UnmatchedMarkException();
    }
    return pos;
  }

  // endregion IOperandStack
}
