import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IInternalState, IOperator } from '@sdk/index.js';
import { OperatorType } from '@sdk/index.js';
import { toValue } from '@test/index.js';
import { State } from './State.js';

let state: State;

beforeEach(() => {
  state = new State();
});

afterEach(() => {
  state.destroy();
});

describe('Constant operator', () => {
  beforeEach(() => {
    state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IOperator>{
        name: 'test',
        type: OperatorType.constant,
        constant: toValue(true)
      }
    });
  });

  it('push the value on the first cycle and pops the call', () => {
    state.cycle();
    expect(state.operands.ref).toStrictEqual([toValue(true)]);
    expect(state.calls.length).toStrictEqual(0);
  });
});

describe('No parameters', () => {
  beforeEach(() => {
    state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IOperator>{
        name: 'test',
        type: OperatorType.implementation,
        implementation: function ({ operands }: IInternalState) {
          operands.push(toValue(true));
        }
      }
    });
  });

  it('executes the implementation on the first cycle', () => {
    state.cycle();
    expect(state.operands.ref).toStrictEqual([toValue(true)]);
    expect(state.calls.length).toStrictEqual(1); // implementation is responsible of popping
  });
});

describe('With parameters', () => {
  beforeEach(() => {
    state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IOperator>{
        name: 'test',
        type: OperatorType.implementation,
        implementation: function ({ operands }: IInternalState, parameters: Value[]) {
          operands.push(
            toValue(
              parameters.length === 1 && parameters[0]?.type === ValueType.integer && parameters[0]?.integer === 123
            )
          );
        },
        typeCheck: [ValueType.integer]
      }
    });
  });

  it('fails with StackUnderflow if the operand stack does not contain enough values', () => {
    state.cycle();
    // TODO: how to handle error !
  });

  it('fails with TypeCheck if the operand stack does not contain the right values', () => {
    state.operands.push(toValue(false));
    state.cycle();
    // TODO: how to handle error !
  });

  it.skip("builds the list of parameters and pass them to the operator's implementation", () => {
    state.operands.push(toValue(123));
    state.cycle();
    expect(state.operands.ref).toStrictEqual([toValue(123)]);
    state.cycle();
    expect(state.operands.ref).toStrictEqual([toValue(true), toValue(123)]);
  });
});
