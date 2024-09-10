import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import gte from './gte.json' with { type: 'json' };

buildFunctionOperator(gte, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  operands.push(toBooleanValue(value2 >= value1));
});
