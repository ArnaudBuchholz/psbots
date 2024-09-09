import type { Value } from '@api/index.js';
import { toStringValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import typeDef from './type.json' with { type: 'json' };

buildFunctionOperator(typeDef, ({ operands }, value: Value) => {
  operands.pop();
  operands.push(toStringValue(value.type));
});
