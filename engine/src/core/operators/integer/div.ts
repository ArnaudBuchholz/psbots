import { toIntegerValue } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

import div from './div.json' with { type: 'json' };

buildFunctionOperator(div, function ({ operands }, value1: number, value2: number) {
  operands.pop();
  operands.pop();
  const reminder = value1 % value2;
  operands.push(toIntegerValue((value1 - reminder) / value2));
  operands.push(toIntegerValue(reminder));
});
