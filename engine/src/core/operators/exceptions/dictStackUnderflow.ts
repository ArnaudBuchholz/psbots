import { buildFunctionOperator } from '@core/operators/operators.js';
import { DictStackUnderflowException } from '@sdk/exceptions/DictStackUnderflowException.js';

import dictStackUnderflow from './dictStackUnderflow.json' with { type: 'json' };

buildFunctionOperator(dictStackUnderflow, function () {
  throw new DictStackUnderflowException();
});
