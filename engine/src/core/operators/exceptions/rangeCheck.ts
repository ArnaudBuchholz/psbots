import { RangeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import rangeCheck from './rangeCheck.json' with { type: 'json' };

buildFunctionOperator(rangeCheck, function () {
  throw new RangeCheckException();
});
