import type { Value } from '@api/index.js';
import { toBooleanValue, valuesOf } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import neq from './neq.json' with { type: 'json' };

buildFunctionOperator(neq, function ({ operands }, value1: Value, value2: Value) {
  operands.pop();
  operands.pop();
  if (value1.type !== value2.type) {
    operands.push(toBooleanValue(true));
  } else {
    const [raw1, raw2] = valuesOf(value1, value2);
    operands.push(toBooleanValue(raw1 !== raw2));
  }
});
