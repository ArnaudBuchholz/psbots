import { buildFunctionOperator } from '@core/operators/operators.js';
import { StackUnderflowException } from '@sdk/exceptions/StackUnderflowException.js';

import stackUnderflow from './stackUnderflow.json' with { type: 'json' };

buildFunctionOperator(stackUnderflow, function () {
  throw new StackUnderflowException();
});
