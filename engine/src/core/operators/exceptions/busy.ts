import { BusyException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import busy from './busy.json' with { type: 'json' };

buildFunctionOperator(busy, function () {
  throw new BusyException();
});
