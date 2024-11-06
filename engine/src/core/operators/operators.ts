import type { IOperatorValue, OperatorValue, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IInternalState, IFunctionOperator } from '@sdk/index.js';
import { OperatorType, InternalException, valuesOf } from '@sdk/index.js';

export type OperatorDefinition = {
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
  signature: {
    input: (ValueType | null)[];
    output: (ValueType | null)[];
    exceptions?: string[];
  };
  samples: {
    description?: string;
    in: string;
    out: string;
  }[];
};

export const registry: {
  [key in string]: {
    definition: OperatorDefinition;
    value: Value<ValueType.operator>;
  };
} = {};

export function buildFunctionOperator(
  definition: OperatorDefinition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  implementation: (state: IInternalState, ...values: any[]) => void
): OperatorValue {
  /* c8 ignore start */ // Should NOT happen
  if (registry[definition.name] !== undefined) {
    throw new InternalException(`Operator ${definition.name} already defined`);
  }
  /* c8 ignore stop */
  Object.freeze(definition); // Can't be altered
  let operator: IFunctionOperator;
  if (definition.signature.input.length > 0) {
    const { input: typeCheck } = definition.signature;
    operator = {
      type: OperatorType.implementation,
      name: definition.name,
      typeCheck,
      implementation: function (state, parameters) {
        const values: unknown[] = parameters.map((value, index) => {
          if (typeCheck[index] === null) {
            return value;
          }
          return valuesOf(value)[0];
        });
        implementation(state, ...values);
      }
    };
  } else {
    operator = {
      type: OperatorType.implementation,
      name: definition.name,
      implementation
    };
  }
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

export function buildConstantOperator(definition: OperatorDefinition, value: Value): void {
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
