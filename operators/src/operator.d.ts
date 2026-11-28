import type { Value, ValueType, OperatorDefinition, IOperatorTypeCheck, IState } from '@psbots/types';

declare global {
  export function operator<T1 extends ValueType>(
    definition: OperatorDefinition<[IOperatorTypeCheck<T1>]>,
    implementation: (state: IState, value: Value<T1>) => void
  ): void;
  export function operator<T1 extends ValueType, T2 extends ValueType>(
    definition: OperatorDefinition<[IOperatorTypeCheck<T1>, IOperatorTypeCheck<T2>]>,
    implementation: (state: IState, value1: Value<T1>, value2: Value<T2>) => void
  ): void;
  export function operator<T1 extends ValueType, T2 extends ValueType, T3 extends ValueType>(
    definition: OperatorDefinition<[IOperatorTypeCheck<T1>, IOperatorTypeCheck<T2>, IOperatorTypeCheck<T3>]>,
    implementation: (
        state: IState,
        value1: Value<T1>,
        value2: Value<T2>,
        value3: Value<T3>
    ) => void
  ): void;
  export function operator(
    definition: OperatorDefinition,
    implementation: (state: IState, ...values: Value[]) => void
  ): void;

  export function toIntegerValue(integer: number): Value<number>;
}