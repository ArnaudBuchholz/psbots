import { buildFunctionOperator } from '@core/operators/operators.js';
import { TypeCheckException } from '@sdk/exceptions/TypeCheckException.js';

import typeCheck from './typeCheck.json';

buildFunctionOperator(typeCheck, function () {
  throw new TypeCheckException();
});
