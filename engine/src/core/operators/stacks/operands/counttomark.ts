import { findMarkPos, toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import counttomark from './counttomark.json' with { type: 'json' };

buildFunctionOperator(counttomark, function ({ operands }) {
  operands.push(toIntegerValue(findMarkPos(operands)));
});
