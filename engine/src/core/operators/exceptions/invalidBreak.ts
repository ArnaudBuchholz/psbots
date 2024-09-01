import { buildFunctionOperator } from '@core/operators/operators.js';
import { InvalidBreakException } from '@sdk/exceptions/InvalidBreakException.js';

import invalidBreak from './invalidBreak.json';

buildFunctionOperator(invalidBreak, function () {
  throw new InvalidBreakException();
});
