import { buildFunctionOperator } from '@core/operators/operators.js';
import { UndefinedException } from '@sdk/exceptions/UndefinedException.js';

import undefinedDef from './undefined.json' with { type: 'json' };

buildFunctionOperator(undefinedDef, function () {
  throw new UndefinedException();
});
