import type { Value } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import { assert } from '@sdk/assert.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { buildFunctionOperator } from '@core/operators/operators.js';

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
  ({ operands, memoryTracker }, { integer: count }, { integer: shift }) => {
    if (count <= 0 || count > operands.length - 2) {
      return { success: false, exception: 'rangeCheck' };
    }
    assert(memoryTracker instanceof MemoryTracker);
    const arrayAllocated = memoryTracker.allocate({ values: count }, SYSTEM_MEMORY_TYPE, operands);
    if (!arrayAllocated.success) {
      return arrayAllocated;
    }
    const values: Value[] = [];
    let offset = (count - 1 + shift) % count;
    if (offset < 0) {
      offset += count;
    }
    for (let index = 0; index < count; ++index) {
      const value = operands.at(2 + offset);
      if (--offset < 0) {
        offset += count;
      }
      value.tracker?.addValueRef(value);
      values.push(value);
    }
    const moved = operands.popush(2 + count, values);
    for (const value of values) {
      value.tracker?.releaseValue(value);
    }
    memoryTracker.release(arrayAllocated.value, operands);
    return moved;
  }
);
