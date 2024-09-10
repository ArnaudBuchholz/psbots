import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import dup from './dup.json' with { type: 'json' };

buildFunctionOperator(dup, function ({ operands }, value: Value) {
  operands.push(value);
});
