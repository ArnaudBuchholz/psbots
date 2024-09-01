import { buildFunctionOperator } from '@core/operators/operators.js';

import clear from './clear.json';

buildFunctionOperator(clear, function ({ operands }) {
  while (operands.length) {
    operands.pop();
  }
});
