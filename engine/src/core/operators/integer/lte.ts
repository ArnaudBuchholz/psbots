import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import lte from './lte.json' with { type: 'json' };

buildFunctionOperator(lte, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  operands.push(toBooleanValue(value2 <= value1));
});
