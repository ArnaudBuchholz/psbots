import { buildFunctionOperator } from '@core/operators/operators.js';
import { BusyException } from '@sdk/exceptions/BusyException.js';

import busy from './busy.json';

buildFunctionOperator(busy, function () {
  throw new BusyException();
});
