import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import gt from './gt.json' with { type: 'json' };

buildFunctionOperator(gt, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  operands.push(toBooleanValue(value1 > value2));
});
