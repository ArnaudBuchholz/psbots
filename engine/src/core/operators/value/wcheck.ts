import type { Value } from '@api/index.js';
import { toBooleanValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import wcheck from './wcheck.json' with { type: 'json' };

buildFunctionOperator(wcheck, ({ operands }, value: Value) => {
  operands.pop();
  operands.push(toBooleanValue(!value.isReadOnly));
});
