import { ValueType } from '@api/index.js';
import { assert, isArrayValue, OPERATOR_STATE_POP } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { pop } from '@core/operators/stacks/operand/pop.js';

export const bind = buildFunctionOperator(
  {
    name: 'bind',
    description: 'binds the block calls to their value by resolving the names from the dictionary stack',
    labels: ['dictstack', 'flow'],
    signature: {
      input: [{ type: ValueType.array, permissions: { isExecutable: true } }],
      output: [{ type: ValueType.array, permissions: { isExecutable: true } }]
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
    const { operands, calls, dictionaries } = state;
    const { topOperatorState: step } = calls;
    const block = operands.top;
    assert(isArrayValue(block));
    const { array } = block;
    assert(array instanceof ValueArray);
    if (step < array.length) {
      const value = array.at(step);
      if (value && value.isExecutable) {
        if (value.type === ValueType.name) {
          const location = dictionaries.where(value.name);
          if (location !== null) {
            const setResult = array.set(step, location.value);
            if (!setResult.success) {
              return setResult;
            }
          }
          calls.topOperatorState = step + 1;
        } else if (value.type === ValueType.array) {
          calls.topOperatorState = step + 1;
          const operandPushResult = operands.push(value);
          if (!operandPushResult.success) {
            return operandPushResult;
          }
          const popInCallsResult = calls.push(pop);
          if (!popInCallsResult.success) {
            return popInCallsResult;
          }
          const bindInCallsResult = calls.push(bind);
          if (!bindInCallsResult.success) {
            return bindInCallsResult;
          }
        }
      } else {
        calls.topOperatorState = step + 1;
      }
    } else {
      calls.topOperatorState = OPERATOR_STATE_POP;
    }
    return { success: true, value: undefined };
  }
);
