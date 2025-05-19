import type { IntegerValue, Result } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import type { IInternalState } from '@sdk/index.js';
import { assert, toIntegerValue, OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_POP } from '@sdk/index.js';

/* Position first value to its right place, then consider then one that has been moved.
        3 1 roll      3 -1 roll     5 1 roll            5 2 roll
        0-2 0-1       0-1 0-2       0-4 0-3 0-2 0-1     0-3 0-1 0-4 0-2
    a    c   b         b   c         e   d   c   b       d   b   e   c
    b    b   c         a   a         b   b   b   c       b   d   d   d
    c    a   a         c   b         c   c   d   d       c   c   c   e
    d                                d   e   e   e       a   a   a   a
    e                                a   a   a   a       e   e   b   b
*/

const SHIFT = 'shift';
const COUNT = 'count';
const POS = 'pos';

function initialize(
  { operands, calls }: IInternalState,
  { integer: count }: IntegerValue,
  { integer: shift }: IntegerValue
): Result<unknown> {
  if (count <= 0 || count > operands.length - 2) {
    return { success: false, exception: 'rangeCheck' };
  }
  if (count === 2) {
    operands.popush(2);
    operands.swap(0, 1);
    return { success: true, value: undefined };
  }
  const shiftResult = toIntegerValue(shift);
  assert(shiftResult);
  const shiftDefined = calls.def(SHIFT, shiftResult.value);
  if (!shiftDefined.success) {
    return shiftDefined;
  }
  const countResult = toIntegerValue(count);
  assert(countResult);
  const countDefined = calls.def(COUNT, countResult.value);
  if (!countDefined.success) {
    return countDefined;
  }
  const posDefined = calls.def(POS, countResult.value);
  if (!posDefined.success) {
    return posDefined;
  }
  calls.topOperatorState = count;
  return operands.popush(2);
}

function roll({ operands, calls }: IInternalState): Result<unknown> {
  const shiftValue = calls.lookup(SHIFT);
  assert(shiftValue.type === 'integer');
  const shift = shiftValue.integer;
  const countValue = calls.lookup(COUNT);
  assert(countValue.type === 'integer');
  const count = countValue.integer;
  const posValue = calls.lookup(POS);
  assert(posValue.type === 'integer');
  let pos = posValue.integer;
  pos = (pos - shift) % count;
  if (pos < 0) {
    pos += count;
  }
  operands.swap(0, pos);
  if (--calls.topOperatorState === 1) {
    calls.topOperatorState = OPERATOR_STATE_POP;
  } else {
    const posResult = toIntegerValue(pos);
    assert(posResult);
    const posDefined = calls.def(POS, posResult.value);
    assert(posDefined); // Same slot, no additional memory
  }
  return { success: true, value: undefined };
}

buildFunctionOperator(
  {
    name: 'roll',
    description: 'performs a circular shift of the values on the operand stack by a given amount',
    labels: ['operand'],
    signature: {
      input: [{ type: 'integer' }, { type: 'integer' }]
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
        in: '{} <<>> 2 1 roll',
        out: '<<>> {}'
      },
      {
        in: '<<>> {} 2 -1 roll',
        out: '{} <<>>'
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
  (state, countValue: IntegerValue, shiftValue: IntegerValue) => {
    if (state.calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
      return initialize(state, countValue, shiftValue);
    }
    return roll(state);
  }
);
