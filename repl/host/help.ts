import { getOperatorDefinitionRegistry, ValueType } from '@psbots/engine';
import type { Value } from '@psbots/engine';
import { OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator } from '@psbots/engine/sdk';
import { cyan, white, yellow } from '../colors.js';
import type { IReplIO } from '../IReplIO.js';

export function createHelpOperator(replIO: IReplIO): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'help',
      type: OperatorType.implementation,
      implementation: (/*internalState: IInternalState*/) => {
        const operators = getOperatorDefinitionRegistry();
        const names = Object.keys(operators).sort();
        for (const name of names) {
          const definition = operators[name];
          replIO.output(`${yellow}${name}${cyan} ${definition?.description}${white}\r\n`);
        }
      }
    }
  };
}
