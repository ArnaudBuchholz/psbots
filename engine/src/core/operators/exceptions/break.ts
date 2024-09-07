import { BreakException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import breakDef from './break.json' with { type: 'json' };

buildFunctionOperator(breakDef, function () {
  throw new BreakException();
});
