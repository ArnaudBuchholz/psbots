import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Exception } from '@api/index.js';
import { enumIArrayValues, markValue, ValueType } from '@api/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';
import {
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OperatorType,
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
    assert(
      state.calls.push({
        type: ValueType.operator,
        isExecutable: true,
        isReadOnly: true,
        operator: <IOperator>{
          name: 'test',
          type: OperatorType.constant,
          constant: toValue(true)
        }
      })
    );
  });

  it('push the value on the first cycle and pops the call', () => {
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(true)]);
    expect(state.calls.length).toStrictEqual(0);
  });
});

function pushFunctionOperatorToCallStack(operator: Partial<IFunctionOperator>) {
  assert(
    state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: {
        name: 'test',
        type: OperatorType.implementation,
        ...operator
      }
    })
  );
}

describe('No parameters', () => {
  it('executes the implementation on the first cycle', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }) {
        assert(operands.push(toValue(true)));
      }
    });
    state.cycle();
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(true)]);
  });
});

describe('With parameters', () => {
  describe('specific parameter type', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ operands }, ...values) {
          assert(
            operands.push(
              toValue(values.length === 1 && values[0]?.type === ValueType.integer && values[0]?.integer === 123)
            )
          );
        },
        typeCheck: [{ type: ValueType.integer }]
      });
    });

    it('fails with StackUnderflow if the operand stack does not contain enough values', () => {
      state.cycle();
      expect(state.exception).toStrictEqual<Exception>('stackUnderflow');
    });

    it('fails with TypeCheck if the operand stack does not contain the right values', () => {
      assert(state.operands.push(toValue(false)));
      state.cycle();
      expect(state.exception).toStrictEqual<Exception>('typeCheck');
    });

    it("builds the list of parameters and pass them to the operator's implementation", () => {
      assert(state.operands.push(toValue(123)));
      state.cycle();
      expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(true), toValue(123)]);
    });
  });

  describe('generic parameter type', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ operands }, ...values) {
          assert(operands.push(toValue(values.length === 1)));
        },
        typeCheck: [{ type: ValueType.null }]
      });
    });

    afterEach(() => {
      state.cycle();
      expect([...enumIArrayValues(state.operands)][0]).toStrictEqual(toValue(true));
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
        implementation({ operands }, ...values) {
          assert(
            operands.push(
              toValue(
                values.length === 2 &&
                  values[0]?.type === ValueType.integer &&
                  values[0]?.integer === 123 &&
                  values[1]?.type === ValueType.boolean &&
                  values[1]?.isSet === true
              )
            )
          );
        },
        typeCheck: [{ type: ValueType.integer }, { type: ValueType.boolean }]
      });
    });

    it('fails with StackUnderflow if the operand stack does not contain enough values', () => {
      state.cycle();
      expect(state.exception).toStrictEqual<Exception>('stackUnderflow');
    });

    it('fails with StackUnderflow if the operand stack does not contain enough values (only one passed)', () => {
      assert(state.operands.push(toValue('abc')));
      state.cycle();
      expect(state.exception).toStrictEqual<Exception>('stackUnderflow');
    });

    it("builds the list of parameters and pass them to the operator's implementation", () => {
      assert(state.operands.push(toValue(123)));
      assert(state.operands.push(toValue(true)));
      state.cycle();
      expect(state.exception).toBeUndefined();
      expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(true), toValue(true), toValue(123)]);
    });
  });

  describe('memory management', () => {
    let sharedObject: ShareableObject;

    beforeEach(() => {
      const { object, value } = toValue.createSharedObject();
      sharedObject = object;
      pushFunctionOperatorToCallStack({
        implementation({ operands }) {
          assert(operands.push(toValue(sharedObject.refCount === 3)));
        },
        typeCheck: [{ type: value.type }]
      });
      assert(state.operands.push(value));
      expect(sharedObject.refCount).toStrictEqual(2);
    });

    it('addValueRef on the parameters', () => {
      state.cycle();
      expect(state.operands.at(0)).toStrictEqual(toValue(true));
    });

    it('release the parameters after call', () => {
      state.cycle();
      expect(sharedObject.refCount).toStrictEqual(2);
    });
  });

  describe('multiple cycles', () => {
    beforeEach(() => {
      pushFunctionOperatorToCallStack({
        implementation({ calls, operands }, ...values) {
          if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
            operands.pop(); // remove 123 from the stack
            calls.topOperatorState = 1;
          } else {
            assert(operands.push(toValue(values.length === 0)));
            calls.topOperatorState = OPERATOR_STATE_POP;
          }
        },
        typeCheck: [{ type: ValueType.null }]
      });
      assert(state.operands.push(toValue(123)));
    });

    it('uses step to control the parameters passing', () => {
      state.cycle();
      expect(state.operands.length).toStrictEqual(0);
      expect(state.calls.length).toStrictEqual(1);
      state.cycle();
      expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(true)]);
      expect(state.calls.length).toStrictEqual(0);
    });
  });
});

describe('operator lifecycle', () => {
  it('is immediately removed from call stack if topOperatorState is not used and no subsequent call', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }) {
        assert(operands.push(toValue(true)));
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(true)]);
  });

  it('is not removed from call stack when topOperatorState is used until set to OPERATOR_STATE_POP', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          calls.topOperatorState = 1;
          assert(operands.push(toValue(1)));
        } else {
          calls.topOperatorState = OPERATOR_STATE_POP;
          assert(operands.push(toValue(2)));
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
  });

  it('is removed from call stack after the subsequent call is finished', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }) {
        operands.push(toValue(1));
        pushFunctionOperatorToCallStack({
          implementation({ operands }) {
            assert(operands.push(toValue(2)));
          }
        });
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
  });

  it('continues to execute the operator after subsequent call until topOperatorState is OPERATOR_STATE_POP', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          calls.topOperatorState = 1;
          assert(operands.push(toValue(1)));
          pushFunctionOperatorToCallStack({
            implementation({ operands }) {
              assert(operands.push(toValue(2)));
            }
          });
        } else {
          calls.topOperatorState = OPERATOR_STATE_POP;
          assert(operands.push(toValue(3)));
          pushFunctionOperatorToCallStack({
            implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
              assert(operands.push(toValue(4)));
            }
          });
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(4), toValue(3), toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
  });

  it('handles OPERATOR_STATE_CALL_BEFORE_POP', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
          assert(operands.push(toValue(1)));
        } else {
          assert(operands.push(toValue(2)));
          calls.topOperatorState = OPERATOR_STATE_POP;
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
  });

  it('may stack new calls during the pop', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          assert(operands.push(toValue(1)));
          calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
        } else {
          assert(operands.push(toValue(2)));
          calls.topOperatorState = OPERATOR_STATE_POP;
          assert(calls.push(toValue(3)));
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
  });

  it('calls on pop if an exception occurred (even while looping), popping can be called several times', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }) {
        if (calls.topOperatorState === OPERATOR_STATE_FIRST_CALL) {
          assert(operands.push(toValue(1)));
          calls.topOperatorState = 1;
        } else if (calls.topOperatorState === 1) {
          operands.pop();
          assert(operands.push(toValue(2)));
          calls.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
          pushFunctionOperatorToCallStack({
            implementation(state) {
              operands.pop();
              assert(operands.push(toValue(3)));
              state.raiseException('stop');
            }
          });
        } else if (calls.topOperatorState === OPERATOR_STATE_CALL_BEFORE_POP) {
          operands.pop();
          assert(operands.push(toValue(4)));
          calls.topOperatorState = -100;
        } else {
          operands.pop();
          assert(operands.push(toValue(5)));
          calls.topOperatorState = OPERATOR_STATE_POP;
        }
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(1)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(2)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(2);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(3)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(3)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(4)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(1);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual([toValue(5)]);
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
  });
});
