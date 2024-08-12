import type { ValueType, Value } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

/** Operand stack */
export interface IOperandStack extends IStack {
  /** The returned values are not addValueRef'ed (if tracked) */
  check: (<T extends ValueType>(type: T | null) => readonly [Value<T>]) &
    (<T1 extends ValueType, T2 extends ValueType>(
      type1: T1 | null,
      type2: T2 | null
    ) => readonly [Value<T1>, Value<T2>]) &
    (<T1 extends ValueType, T2 extends ValueType, T3 extends ValueType>(
      type1: T1 | null,
      type2: T2 | null,
      type3: T3 | null
    ) => readonly [Value<T1>, Value<T2>, Value<T3>]) &
    ((...types: Array<ValueType | null>) => readonly Value[]);
  findMarkPos: () => number;
}
