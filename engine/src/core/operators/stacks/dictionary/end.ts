import { buildFunctionOperator } from '@core/operators/operators.js';

buildFunctionOperator(
  {
    name: 'end',
    description:
      'pops the current dictionary off the dictionary stack, making the dictionary below it the current dictionary',
    labels: ['dictstack'],
    samples: [
      {
        in: '<< /test 1 >> begin end test',
        out: 'undefined'
      }
    ]
  },
  ({ dictionaries }) => dictionaries.pop()
);
