import { /* getOperatorDefinitionRegistry, */ createState, ValueType } from '@psbots/engine';
import type { Result, Value, IState } from '@psbots/engine';
import { assert, OperatorType } from '@psbots/engine/sdk';
import type { IFunctionOperator, IInternalState } from '@psbots/engine/sdk';
// import { cyan, white, yellow } from '../colors.js';
import type { IReplIO } from '../IReplIo.js';

const MAX_CYCLES = 10 ** 9;

function getMeasureName({ calls }: IState) {
  const value = calls.at(0);
  if (!value.isExecutable) {
    return `literal_${value.type}`;
  }
  if (value.type === ValueType.string) {
    return 'parser';
  }
  if (value.type === ValueType.array) {
    return 'block';
  }
  if (value.type === ValueType.operator) {
    const { topOperatorState } = calls;
    if (topOperatorState !== 0 && topOperatorState !== Number.POSITIVE_INFINITY) {
      return `-${value.operator.name}-@${ topOperatorState > 0 ? '+' : '-' }`;
    }
    return `-${value.operator.name}-`;
  }
  if (value.type === ValueType.name) {
    return `name_${value.name}`;
  }
  throw new Error(`Missing measure name for ${JSON.stringify(value)}`);
}

function execute(value: Value, loops: number) {
  let cycles = 0;
  for (let loop = 0; loop < loops; ++loop) {
    const stateCreated = createState();
    assert(stateCreated);
    const { value: state } = stateCreated;
    const executed = state.exec(value);
    assert(executed);
    const { value: iterator } = executed;
    while (++cycles < MAX_CYCLES) {
      const { calls } = state;
      if (calls.length > 0) {
        const measureName = getMeasureName(state);
        const start = performance.now();
        iterator.next();
        const end = performance.now();
        performance.measure(measureName, { start, end });
      } else {
        const { done } = iterator.next();
        assert(done === true);
        break;
      }
    }
    state.destroy();
  }
}

export function createPerfOperator(replIO: IReplIO): Value<ValueType.operator> {
  return {
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IFunctionOperator>{
      name: 'perf',
      type: OperatorType.implementation,
      implementation: (internalState: IInternalState): Result<undefined> => {
        const { operands } = internalState;
        if (operands.length < 2) {
          return { success: false, exception: 'rangeCheck' };
        }
        const value = operands.top;
        if (
          (value.type !== ValueType.array || !value.isExecutable) &&
          (value.type !== ValueType.string || value.string !== 'samples')
        ) {
          return { success: false, exception: 'typeCheck' };
        }
        
        return { success: true, value: undefined };
      }
    }
  };
}
