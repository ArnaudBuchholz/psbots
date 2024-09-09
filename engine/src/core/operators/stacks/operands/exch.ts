import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import exch from './exch.json' with { type: 'json' };

buildFunctionOperator(exch, function ({ operands }, value1: Value, value2: Value) {
  operands.pop();
  operands.pop();
  operands.push(value1);
  operands.push(value2);
});
