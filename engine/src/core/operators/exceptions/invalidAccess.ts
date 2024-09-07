import { InvalidAccessException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import invalidAccess from './invalidAccess.json' with { type: 'json' };

buildFunctionOperator(invalidAccess, function () {
  throw new InvalidAccessException();
});
