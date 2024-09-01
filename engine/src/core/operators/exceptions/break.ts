import { buildFunctionOperator } from '@core/operators/operators.js';
import { BreakException } from '@sdk/exceptions/BreakException.js';

import breakDef from './break.json';

buildFunctionOperator(breakDef, function () {
  throw new BreakException();
});
