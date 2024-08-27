import { ValueType } from '@api/index.js';
import { buildOperator } from '../build-operator';

import add from './add.json';

buildOperator(add, function({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  operands.push({
    type: ValueType.integer,
    isExecutable: false,
    isReadOnly: true,
    integer: value1 + value2
  });
});
