import { UnmatchedMarkException } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import unmatchedMark from './unmatchedMark.json' with { type: 'json' };

buildFunctionOperator(unmatchedMark, function () {
  throw new UnmatchedMarkException();
});
