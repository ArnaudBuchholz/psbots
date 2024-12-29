import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { RangeCheckException } from '@sdk/index.js';

buildFunctionOperator(
  {
    name: 'roll',
    description: 'performs a circular shift of the values on the operand stack by a given amount',
    labels: ['operand'],
    signature: {
      input: [{ type: ValueType.integer }, { type: ValueType.integer }]
    },
    samples: [
      {
        in: '100 200 300 3 -1 roll',
        out: '200 300 100'
      },
      {
        in: '100 200 300 3 1 roll',
        out: '300 100 200'
      },
      {
        in: '100 200 300 3 0 roll',
        out: '100 200 300'
      },
      {
        in: '"a" "b" "c" 3 2 roll',
        out: '"b" "c" "a"'
      },
      {
        description: 'fails if the number of values to roll is invalid',
        in: '100 200 300 0 0 roll',
        out: '100 200 300 0 0 rangecheck'
      },
      {
        description: 'fails if the number of values to roll is invalid',
        in: '100 200 300 -1 0 roll',
        out: '100 200 300 0 0 rangecheck'
      },
      {
        description: 'fails if the number of values to roll is invalid',
        in: '100 200 300 4 0 roll',
        out: '100 200 300 0 0 rangecheck'
      },
      {
        description: 'fails if the number of values to roll is invalid',
        in: '100 200 300 50 0 roll',
        out: '100 200 300 0 0 rangecheck'
      }
    ]
  },
  ({ operands }, { integer: count }, { integer: shift }) => {
    // TODO: rewrite to pop and push only once
    // Intermediate value array *must* be allocated
    if (count <= 0 || count > operands.length - 2) {
      return { success: false, error: new RangeCheckException() };
    }
    operands.pop();
    operands.pop();
    shift = -shift % count;
    if (shift === 0) {
      return;
    }
    if (shift < 0) {
      shift += count;
    }
    const values = [];
    try {
      for (let remaining = count; remaining > 0; --remaining) {
        const value = operands.top;
        values.unshift(value);
        value.tracker?.addValueRef(value);
        // TODO: do not pop until all pushes succeeded
        operands.pop();
      }
      for (let from = 0; from < count; ++from) {
        const value = values[(from + shift) % count]!;
        // TODO: do not pop until all pushes succeeded
        operands.push(value);
      }
    } finally {
      for (const value of values) {
        value.tracker?.releaseValue(value);
      }
    }
    return { success: true, value: undefined };
  }
);
