import { VmOverflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import vmOverflow from './vmOverflow.json' with { type: 'json' };

buildFunctionOperator(vmOverflow, function () {
  throw new VmOverflowException();
});
