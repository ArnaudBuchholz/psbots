import { buildFunctionOperator } from '@core/operators/operators.js';
import { UnmatchedMarkException } from '@sdk/exceptions/UnmatchedMarkException.js';

import unmatchedMark from './unmatchedMark.json' with { type: 'json' };

buildFunctionOperator(unmatchedMark, function () {
  throw new UnmatchedMarkException();
});
