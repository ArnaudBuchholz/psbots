import { StackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import index from './index-op.json' with { type: 'json' };

buildFunctionOperator(index, function ({ operands }, offset: number) {
  if (offset > operands.length) {
    throw new StackUnderflowException();
  }
  operands.pop();
  const value = operands.at(offset)!;
  operands.push(value);
});
