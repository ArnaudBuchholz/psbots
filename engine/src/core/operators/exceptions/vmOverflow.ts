import { buildFunctionOperator } from '@core/operators/operators.js';
import { VmOverflowException } from '@sdk/exceptions/VmOverflowException.js';

import vmOverflow from './vmOverflow.json';

buildFunctionOperator(vmOverflow, function () {
  throw new VmOverflowException();
});