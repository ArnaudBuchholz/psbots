import { buildFunctionOperator } from '@core/operators/operators.js';
import { openWithMark } from '@core/operators/open-close.js';

import openBlock from './open-block.json' with { type: 'json' };

buildFunctionOperator(openBlock, openWithMark);
