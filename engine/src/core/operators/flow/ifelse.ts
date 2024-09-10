import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import ifelse from './ifelse.json' with { type: 'json' };

buildFunctionOperator(ifelse, function ({ operands, calls }, condition: boolean, ifValue: Value, elseValue: Value) {
  operands.pop();
  operands.pop();
  operands.pop();
  if (condition) {
    calls.push(ifValue);
  } else {
    calls.push(elseValue);
  }
});
