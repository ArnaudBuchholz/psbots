import { TypeCheckException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import typeCheck from './typeCheck.json' with { type: 'json' };

buildFunctionOperator(typeCheck, function () {
  throw new TypeCheckException();
});
