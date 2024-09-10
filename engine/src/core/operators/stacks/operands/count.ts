import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import count from './count.json' with { type: 'json' };

buildFunctionOperator(count, function ({ operands }) {
  operands.push(toIntegerValue(operands.length));
});
