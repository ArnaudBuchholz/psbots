import type { Result, Value } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { assert, isArrayValue, OPERATOR_STATE_POP } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { pop } from '@core/operators/stacks/operand/pop.js';

function bindName(state: IInternalState, array: ValueArray, index: number, name: string): Result<unknown> {
  const { calls, dictionaries } = state;
  const location = dictionaries.where(name);
  if (location !== null) {
    const bound = array.set(index, location.value);
    if (!bound.success) {
      return bound;
    }
  }
  calls.topOperatorState = index + 1;
  return { success: true, value: undefined };
}

function bindArray(state: IInternalState, array: ValueArray, index: number, value: Value): Result<unknown> {
  const { operands, calls } = state;
  calls.topOperatorState = index + 1;
  const arrayPushed = operands.push(value);
  if (!arrayPushed.success) {
    return arrayPushed;
  }
  const popPushed = calls.push(pop);
  if (!popPushed.success) {
    return popPushed;
  }
  const bindPushed = calls.push(bind);
  if (!bindPushed.success) {
    return bindPushed;
  }
  return { success: true, value: undefined };
}

function bindValue(state: IInternalState, array: ValueArray, index: number): Result<unknown> {
  const { calls } = state;
  const value = array.at(index);
  if (!value.isExecutable) {
    calls.topOperatorState = index + 1;
    return { success: true, value: undefined };
  }
  if (value.type === 'name') {
    return bindName(state, array, index, value.name);
  }
  assert(value.type === 'array');
  return bindArray(state, array, index, value);
}

export const bind = buildFunctionOperator(
  {
    name: 'bind',
    description: 'binds the block calls to their value by resolving the names from the dictionary stack',
    labels: ['dictstack', 'flow'],
    signature: {
      input: [{ type: 'array', permissions: { isExecutable: true } }],
      output: [{ type: 'array', permissions: { isExecutable: true } }]
    },
    samples: [
      {
        in: '{ clear } bind 0 get',
        out: 'systemdict /clear get'
      },
      {
        description: 'does not fail on unknown names',
        in: '{ clear test_unknown bind } bind 2 get',
        out: 'systemdict /bind get'
      },
      {
        description: 'works recursively',
        in: '{ clear { bind } } bind 1 get 0 get',
        out: 'systemdict /bind get'
      },
      {
        description: 'works only on code blocks',
        in: '[ 1 2 ] bind',
        out: '[ 1 2 ] typecheck'
      },
      {
        description: 'does nothing when no names are used',
        in: '{ {} 1 2 3 } bind',
        out: '{ {} 1 2 3 }'
      },
      {
        description: 'works on mixed content',
        in: '{ 1 clear } bind 1 get',
        out: 'systemdict /clear get'
      }
    ]
  },
  (state) => {
    const { operands, calls } = state;
    const { topOperatorState: step } = calls;
    const block = operands.top;
    assert(isArrayValue(block));
    const { array } = block;
    assert(array instanceof ValueArray);
    if (step < array.length) {
      return bindValue(state, array, step);
    }
    calls.topOperatorState = OPERATOR_STATE_POP;
    return { success: true, value: undefined };
  }
);
