import { buildFunctionOperator } from '@core/operators/operators.js';
import { RangeCheckException } from '@sdk/exceptions/RangeCheckException.js';

import rangeCheck from './rangeCheck.json';

buildFunctionOperator(rangeCheck, function () {
  throw new RangeCheckException();
});
