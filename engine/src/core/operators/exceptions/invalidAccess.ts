import { buildFunctionOperator } from '@core/operators/operators.js';
import { InvalidAccessException } from '@sdk/exceptions/InvalidAccessException.js';

import invalidAccess from './invalidAccess.json' with { type: 'json' };

buildFunctionOperator(invalidAccess, function () {
  throw new InvalidAccessException();
});
