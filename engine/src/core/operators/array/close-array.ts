import type { IInternalState } from '@sdk/interfaces';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { closeToMark } from '@core/operators/open-close.js';

import closeArray from './close-array.json' with { type: 'json' };

buildFunctionOperator(closeArray, (state: IInternalState) => {
  closeToMark(state, { isExecutable: false });
});
