import { enumIArrayValues } from '@api/index.js';
import type { IReadOnlyArray } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import aload from './aload.json' with { type: 'json' };

buildFunctionOperator(aload, ({ operands }, array: IReadOnlyArray) => {
  operands.pop();
  for (const value of enumIArrayValues(array)) {
    operands.push(value);
  }
});
