import type { IOperatorValue, OperatorValue, Result, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IInternalState, IFunctionOperator, IOperatorTypeCheck } from '@sdk/index.js';
import { assert, OperatorType } from '@sdk/index.js';

export type OperatorDefinition<Input = IOperatorTypeCheck[]> = {
  name: string;
  aliases?: string[];
  description: string;
  postScriptDeviation?: string;
  labels: (
    | 'array'
    | 'boolean'
    | 'callstack'
    | 'comparison'
    | 'conversion'
    | 'dictionary'
    | 'dictstack'
    | 'exception'
    | 'flow'
    | 'generic'
    | 'integer'
    | 'loop'
    | 'mark'
    | 'math'
    | 'operand'
    | 'permission'
    | 'value'
  )[];
  signature?: {
    input?: Input;
    output?: [IOperatorTypeCheck] | [IOperatorTypeCheck, IOperatorTypeCheck];
    exceptions?: [string];
  };
  samples: {
    description?: string;
    in: string;
    out: string;
  }[];
};

export const registry: {
  [key in string]: {
    definition: OperatorDefinition<IOperatorTypeCheck[]>;
    value: Value<ValueType.operator>;
  };
} = {};

export function buildFunctionOperator<T1 extends ValueType>(
  definition: OperatorDefinition<[IOperatorTypeCheck<T1>]>,
  implementation: (state: IInternalState, value: Value<T1>) => Result<unknown> | void
): OperatorValue;
export function buildFunctionOperator<T1 extends ValueType, T2 extends ValueType>(
  definition: OperatorDefinition<[IOperatorTypeCheck<T1>, IOperatorTypeCheck<T2>]>,
  implementation: (state: IInternalState, value1: Value<T1>, value2: Value<T2>) => Result<unknown> | void
): OperatorValue;
export function buildFunctionOperator<T1 extends ValueType, T2 extends ValueType, T3 extends ValueType>(
  definition: OperatorDefinition<[IOperatorTypeCheck<T1>, IOperatorTypeCheck<T2>, IOperatorTypeCheck<T3>]>,
  implementation: (
    state: IInternalState,
    value1: Value<T1>,
    value2: Value<T2>,
    value3: Value<T3>
  ) => Result<unknown> | void
): OperatorValue;
export function buildFunctionOperator(
  definition: OperatorDefinition,
  implementation: (state: IInternalState, ...values: Value[]) => Result<unknown> | void
): OperatorValue {
  assert(!registry[definition.name], `Operator ${definition.name} is not defined`);
  Object.freeze(definition); // Can't be altered
  const operator: IFunctionOperator = {
    type: OperatorType.implementation,
    name: definition.name,
    typeCheck: definition.signature?.input,
    implementation
  };
  const value = {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator
  } satisfies IOperatorValue;
  registry[definition.name] = {
    definition,
    value
  };
  if (definition.aliases) {
    definition.aliases.forEach((alias) => {
      registry[alias] = {
        definition,
        value: {
          ...value,
          operator: {
            ...value.operator,
            name: alias
          }
        }
      };
    });
  }
  return value;
}

export function buildConstantOperator(definition: OperatorDefinition<IOperatorTypeCheck[]>, value: Value): void {
  const operator = {
    type: OperatorType.constant,
    name: definition.name,
    constant: value
  };
  registry[definition.name] = {
    definition,
    value: {
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator
    }
  };
}
