import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import add from './add.json' with { type: 'json' };

buildFunctionOperator(add, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  operands.push(toIntegerValue(value1 + value2));
});
