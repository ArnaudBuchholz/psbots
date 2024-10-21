import { ValueType } from '@api/index.js';
import { checkArrayValue, OPERATOR_STATE_POP, TypeCheckException, valuesOf } from '@sdk/index.js';
import { ValueArray } from '@core/objects/ValueArray.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { pop } from '@core/operators/stacks/operand/pop.js';

const bind = buildFunctionOperator(
  {
    name: 'bind',
    description: 'binds the block calls to their value by resolving the names from the dictionary stack',
    labels: ['dictstack', 'flow'],
    signature: {
      input: [ValueType.array], // TODO: how to identify executable code blocks
      output: [ValueType.array]
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
      }
    ]
  },
  ({ operands, calls, dictionaries }) => {
    const { topOperatorState: step } = calls;
    checkArrayValue(operands.top); // Already validated with signature but for TypeScript
    const [array] = valuesOf<ValueType.array>(operands.top);
    if (!operands.top.isExecutable || !(array instanceof ValueArray)) {
      throw new TypeCheckException();
    }
    if (step < array.length) {
      const value = array.at(step);
      calls.topOperatorState = step + 1;
      if (value && value.isExecutable) {
        if (value.type === ValueType.string) {
          const location = dictionaries.where(value.string);
          if (location !== null) {
            array.set(step, location.value);
          }
        } else if (value.type === ValueType.array) {
          operands.push(value);
          calls.push(pop);
          calls.push(bind);
        }
      }
    } else {
      calls.topOperatorState = OPERATOR_STATE_POP;
    }
  }
);
