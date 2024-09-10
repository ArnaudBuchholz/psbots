import type { Value } from '@api/index.js';
import { toStringValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import typeDef from './type.json' with { type: 'json' };

buildFunctionOperator(typeDef, ({ operands, memoryTracker }, value: Value) => {
  operands.pop();
  operands.push(Object.assign(toStringValue(value.type), { tracker: memoryTracker }));
});
