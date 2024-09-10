import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import div from './div.json' with { type: 'json' };

buildFunctionOperator(div, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  const reminder = value2 % value1;
  operands.push(toIntegerValue((value2 - reminder) / value1));
  operands.push(toIntegerValue(reminder));
});
