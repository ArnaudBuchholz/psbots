import { StackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import stackUnderflow from './stackUnderflow.json' with { type: 'json' };

buildFunctionOperator(stackUnderflow, function () {
  throw new StackUnderflowException();
});
