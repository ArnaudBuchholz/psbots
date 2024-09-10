import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import sub from './sub.json' with { type: 'json' };

buildFunctionOperator(sub, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  operands.push(toIntegerValue(value1 - value2));
});
