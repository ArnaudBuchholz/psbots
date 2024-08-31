import { toMarkValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operators.js';

import mark from './mark.json';

buildConstantOperator(mark, toMarkValue());
