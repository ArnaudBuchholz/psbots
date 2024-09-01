import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import swap from './swap.json';

buildFunctionOperator(swap, function ({ operands }, value1: Value, value2: Value) {
  operands.pop();
  operands.pop();
  operands.push(value1);
  operands.push(value2);
});
