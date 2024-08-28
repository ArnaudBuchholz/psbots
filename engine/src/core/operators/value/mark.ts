import { toMarkValue } from '@sdk/index.js';
import { buildConstantOperator } from '../operator.js';

import mark from './mark.json';

buildConstantOperator(mark, toMarkValue());
