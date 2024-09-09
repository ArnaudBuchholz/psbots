import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { closeToMark } from '@core/operators/open-close.js';

import closeBlock from './close-block.json' with { type: 'json' };

buildFunctionOperator(closeBlock, (state: IInternalState) => {
  closeToMark(state, { isExecutable: true });
});
