import { InvalidBreakException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import invalidBreak from './invalidBreak.json' with { type: 'json' };

buildFunctionOperator(invalidBreak, function () {
  throw new InvalidBreakException();
});
