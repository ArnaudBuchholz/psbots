import type { IArray, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { STEP_DONE, TypeCheckException, valuesOf } from '@sdk/index.js';

buildFunctionOperator(
  {
    name: 'bind',
    description: 'binds the array calls to their value by resolving the calls from the dictionary stack',
    labels: ['dictstack', 'flow'],
    signature: {
      input: [ValueType.array],
      output: [ValueType.array]
    },
    samples: [
      {
        in: '{ clear } bind 0 get',
        out: 'systemdict "clear" get'
      },
      {
        description: 'does not fail on unknown names',
        in: '{ clear test_unknown bind } bind 2 get',
        out: 'systemdict "bind" get'
      },
      {
        description: 'works only on code blocks',
        in: '[ 1 2 ] bind',
        out: '[ 1 2 ] typecheck'
      }
    ]
  },
  ({ operands, calls, dictionaries }) => {
    let { step } = calls;
    const [array] = valuesOf<ValueType.array>(operands.top as Value<ValueType.array>); // Validated by input specification
    if (step === undefined || step === STEP_DONE) {
      if (!operands.top.isExecutable) {
        throw new TypeCheckException();
      }
      step = 0;
    }
    if (step < array.length) {
      const value = array.at(step);
      if (value && value.isExecutable && value.type === ValueType.string) {
        const location = dictionaries.where(value.string);
        if (location !== null) {
          (array as IArray).set(step, location.value);
        }
      }
      ++step;
    }
    if (step === array.length) {
      calls.step = STEP_DONE;
    } else {
      calls.step = step;
    }
  }
);
