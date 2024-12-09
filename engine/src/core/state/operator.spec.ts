import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { markValue, ValueType } from '@api/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';
import {
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OperatorType,
  StackUnderflowException,
  TypeCheckException,
  BaseException,
  assert
} from '@sdk/index.js';
import { toValue } from '@test/index.js';
import { State } from './State.js';
import type { ShareableObject } from '@core/objects/ShareableObject.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
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

function pushFunctionOperatorToCallStack(operator: Partial<IFunctionOperator>) {
  state.calls.push({
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: {
      name: 'test',
      type: OperatorType.implementation,
      ...operator
    }
  });
}

describe('No parameters', () => {
  it('executes the implementation on the first cycle', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }: IInternalState) {
        operands.push(toValue(true));
      }
    });
    state.cycle();
    expect(state.operands.ref).toStrictEqual([toValue(true)]);
  });
});

describe('With parameters', () => {
  describe('specific parameter type', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ operands }: IInternalState, parameters: readonly Value[]) {
          operands.push(
            toValue(
              parameters.length === 1 && parameters[0]?.type === ValueType.integer && parameters[0]?.integer === 123
            )
          );
        },
        typeCheck: [ValueType.integer]
      });
    });

    it('fails with StackUnderflow if the operand stack does not contain enough values', () => {
      state.cycle();
      expect(state.exception).toBeInstanceOf(StackUnderflowException);
    });

    it('fails with TypeCheck if the operand stack does not contain the right values', () => {
      state.operands.push(toValue(false));
      state.cycle();
      expect(state.exception).toBeInstanceOf(TypeCheckException);
    });

    it("builds the list of parameters and pass them to the operator's implementation", () => {
      state.operands.push(toValue(123));
      state.cycle();
      expect(state.operands.ref).toStrictEqual([toValue(true), toValue(123)]);
    });
  });

  describe('generic parameter type', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ operands }: IInternalState, parameters: readonly Value[]) {
          operands.push(toValue(parameters.length === 1));
        },
        typeCheck: [null]
      });
    });

    afterEach(() => {
      state.cycle();
      expect(state.operands.ref[0]).toStrictEqual(toValue(true));
    });

    it('supports boolean', () => state.operands.push(toValue(true)));
    it('supports integer', () => state.operands.push(toValue(123)));
    it('supports string', () => state.operands.push(toValue('abc')));
    it('supports mark', () => state.operands.push(markValue));
    it('supports operator', () => state.operands.push(toValue(() => {})));
    it('supports array', () => state.operands.push(toValue([])));
    it('supports dictionary', () => state.operands.push(toValue({})));
  });

  describe('using several parameters', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ operands }: IInternalState, parameters: readonly Value[]) {
          operands.push(
            toValue(
              parameters.length === 2 &&
                parameters[0]?.type === ValueType.integer &&
                parameters[0]?.integer === 123 &&
                parameters[1]?.type === ValueType.boolean &&
                parameters[1]?.isSet === true
            )
          );
        },
        typeCheck: [ValueType.integer, ValueType.boolean]
      });
    });

    it('fails with StackUnderflow if the operand stack does not contain enough values', () => {
      state.cycle();
      expect(state.exception).toBeInstanceOf(StackUnderflowException);
    });

    it('fails with StackUnderflow if the operand stack does not contain enough values (only one passed)', () => {
      state.operands.push(toValue('abc'));
      state.cycle();
      expect(state.exception).toBeInstanceOf(StackUnderflowException);
    });

    it("builds the list of parameters and pass them to the operator's implementation", () => {
      state.operands.push(toValue(123));
      state.operands.push(toValue(true));
      state.cycle();
      expect(state.exception).toBeUndefined();
      expect(state.operands.ref).toStrictEqual([toValue(true), toValue(true), toValue(123)]);
    });
  });

  describe('memory management', () => {
    let sharedObject: ShareableObject;

    beforeEach(() => {
      const { object, value } = toValue.createSharedObject();
      sharedObject = object;
      pushFunctionOperatorToCallStack({
        implementation({ operands }: IInternalState /*, parameters: Value[]*/) {
          operands.push(toValue(sharedObject.refCount === 3));
        },
        typeCheck: [value.type]
      });
      state.operands.push(value);
      expect(sharedObject.refCount).toStrictEqual(2);
    });

    it('addValueRef on the parameters', () => {
      state.cycle();
      expect(state.operands.ref[0]).toStrictEqual(toValue(true));
    });

    it('release the parameters after call', () => {
      state.cycle();
      expect(sharedObject.refCount).toStrictEqual(2);
    });
  });

  describe('multiple cycles', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ calls, operands }: IInternalState, parameters: readonly Value[]) {
          if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
            operands.pop(); // remove 123 from the stack
            calls.topOperatorState = 1;
          } else {
            operands.push(toValue(parameters.length === 0));
            calls.topOperatorState = OPERATOR_STATE_POP;
          }
        },
        typeCheck: [null]
      });
      state.operands.push(toValue(123));
    });

    it('uses step to control the parameters passing', () => {
      state.cycle();
      expect(state.operands.length).toStrictEqual(0);
      expect(state.calls.length).toStrictEqual(1);
      state.cycle();
      expect(state.operands.ref).toStrictEqual([toValue(true)]);
      expect(state.calls.length).toStrictEqual(0);
    });
  });
});

describe('operator lifecycle', () => {
  it('is immediately removed from call stack if topOperatorState is not used and no subsequent call', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
        operands.push(toValue(true));
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect(state.operands.ref).toStrictEqual([toValue(true)]);
  });

  it('is not removed from call stack when topOperatorState is used until set to OPERATOR_STATE_POP', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          calls.topOperatorState = 1;
          operands.push(toValue(1));
        } else {
          calls.topOperatorState = OPERATOR_STATE_POP;
          operands.push(toValue(2));
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
  });

  it('is removed from call stack after the subsequent call is finished', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
        operands.push(toValue(1));
        pushFunctionOperatorToCallStack({
          implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
            operands.push(toValue(2));
          }
        });
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect(state.operands.ref).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
  });

  it('continues to execute the operator after subsequent call until topOperatorState is OPERATOR_STATE_POP', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          calls.topOperatorState = 1;
          operands.push(toValue(1));
          pushFunctionOperatorToCallStack({
            implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
              operands.push(toValue(2));
            }
          });
        } else {
          calls.topOperatorState = OPERATOR_STATE_POP;
          operands.push(toValue(3));
          pushFunctionOperatorToCallStack({
            implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
              operands.push(toValue(4));
            }
          });
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect(state.operands.ref).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect(state.operands.ref).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(4), toValue(3), toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
  });

  it('handles OPERATOR_STATE_CALL_BEFORE_POP', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
          operands.push(toValue(1));
        } else {
          operands.push(toValue(2));
          calls.topOperatorState = OPERATOR_STATE_POP;
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
  });

  it('may stack new calls during the pop', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          operands.push(toValue(1));
          calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
        } else {
          operands.push(toValue(2));
          calls.topOperatorState = OPERATOR_STATE_POP;
          calls.push(toValue(3));
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
  });

  it('calls on pop if an exception occurred (even while looping), popping can be called several times', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          operands.push(toValue(1));
          calls.topOperatorState = 1;
        } else if (calls.topOperatorState === 1) {
          operands.pop();
          operands.push(toValue(2));
          calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
          pushFunctionOperatorToCallStack({
            implementation(state: IInternalState /*, parameters: readonly Value[]*/) {
              operands.pop();
              operands.push(toValue(3));
              state.exception = new BaseException('STOP');
            }
          });
        } else if (calls.topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
          operands.pop();
          operands.push(toValue(4));
          calls.topOperatorState = -100;
        } else {
          operands.pop();
          operands.push(toValue(5));
          calls.topOperatorState = OPERATOR_STATE_POP;
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect(state.operands.ref).toStrictEqual([toValue(2)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect(state.operands.ref).toStrictEqual([toValue(3)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(3)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(4)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect(state.operands.ref).toStrictEqual([toValue(5)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
  });
});
