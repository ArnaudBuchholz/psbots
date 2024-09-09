import { toBooleanValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

import falseDef from './false.json' with { type: 'json' };

buildConstantOperator(falseDef, toBooleanValue(false));
