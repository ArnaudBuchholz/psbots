import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { valuesOf } from '@sdk/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import type { IOperator } from '@sdk/interfaces/IOperator.js';
import { OperatorType } from '@sdk/interfaces/IOperator.js';

export type OperatorDefinition = {
  name: string;
  signature: {
    input: string[];
  };
  samples: {
    description: string;
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
): void {
  let operator: IOperator;
  if (definition.signature.input.length > 0) {
    const typeCheck = definition.signature.input.map((type) => {
      if (type === 'any') {
        return null;
      }
      return ValueType[type as ValueType];
    });
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
