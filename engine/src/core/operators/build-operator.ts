import { ValueType } from '@api/index.js';
import { valueOf } from '@sdk/index.js';
import { IInternalState } from '@sdk/interfaces';
import { IFunctionOperator, OperatorType } from '@sdk/interfaces/IOperator.js';

type OperatorDefinition = {
  name: string;
  signature: {
    input?: string[];
  }
}

// @eslint-disable-next-line das
export function buildOperator(definition: OperatorDefinition, implementation: (state: IInternalState, ...values: any[]) => void): IFunctionOperator {
  if (definition.signature.input) {
    const typeCheck = definition.signature.input.map((type) => {
      if (type === 'any') {
        return null;
      }
      return ValueType[type as ValueType];
    })
    return {
      type: OperatorType.implementation,
      name: definition.name,
      typeCheck,
      implementation: function (state, parameters) {
        const values: unknown[] = parameters.map((value, index) => {
          if (typeCheck[index] === null) {
            return value;
          }
          return valueOf(value);
        });
        implementation(state, ...values);
      }
    };
  }
  return {
    type: OperatorType.implementation,
    name: definition.name,
    implementation
  };
}
