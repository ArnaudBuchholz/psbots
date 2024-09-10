import type { Value } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import ifDef from './if.json' with { type: 'json' };

buildFunctionOperator(ifDef, function ({ operands, calls }, condition: boolean, value: Value) {
  operands.pop();
  operands.pop();
  if (condition) {
    calls.push(value);
  }
});
