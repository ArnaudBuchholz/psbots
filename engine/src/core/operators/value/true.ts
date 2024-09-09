import { toBooleanValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

import trueDef from './true.json' with { type: 'json' };

buildConstantOperator(trueDef, toBooleanValue(true));
