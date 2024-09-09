import { findMarkPos } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import cleartomark from './cleartomark.json' with { type: 'json' };

buildFunctionOperator(cleartomark, function ({ operands }) {
  let markPos = findMarkPos(operands);
  while (markPos-- > 0) {
    operands.pop();
  }
  operands.pop();
});
