import { toMarkValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

import mark from './mark.json' with { type: 'json' };

buildConstantOperator(mark, toMarkValue());
