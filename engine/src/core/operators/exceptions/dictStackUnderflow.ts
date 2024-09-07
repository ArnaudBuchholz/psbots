import { DictStackUnderflowException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import dictStackUnderflow from './dictStackUnderflow.json' with { type: 'json' };

buildFunctionOperator(dictStackUnderflow, function () {
  throw new DictStackUnderflowException();
});
