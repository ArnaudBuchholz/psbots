import { buildFunctionOperator } from '@core/operators/operators.js';
import { openWithMark } from '@core/operators/open-close.js';

import openArray from './open-array.json' with { type: 'json' };

buildFunctionOperator(openArray, openWithMark);
