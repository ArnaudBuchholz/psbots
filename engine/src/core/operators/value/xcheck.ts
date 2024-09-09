import type { Value } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import xcheck from './xcheck.json' with { type: 'json' };

buildFunctionOperator(xcheck, ({ operands }, value: Value) => {
  operands.pop();
  operands.push(toBooleanValue(value.isExecutable));
});
