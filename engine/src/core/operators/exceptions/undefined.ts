import { UndefinedException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import undefinedDef from './undefined.json' with { type: 'json' };

buildFunctionOperator(undefinedDef, function () {
  throw new UndefinedException();
});
