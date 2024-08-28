import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IFunctionOperator, IInternalState, IOperator } from '@sdk/index.js';
import { OperatorType, StackUnderflowException, STEP_DONE, TypeCheckException } from '@sdk/index.js';
import { toValue } from '@test/index.js';
import { State } from './State.js';
import type { ShareableObject } from '@core/objects/ShareableObject.js';

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

function pushFunctionOperatorToCallStack(operator: Partial<IFunctionOperator>) {
  state.calls.push({
    type: ValueType.operator,
    isExecutable: true,
    isReadOnly: true,
    operator: <IOperator>{
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
    it('supports mark', () => state.operands.push(toValue.mark));
    it('supports operator', () => state.operands.push(toValue(() => {})));
    it('supports array', () => state.operands.push(toValue([])));
    it('supports dictionary', () => state.operands.push(toValue({})));
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
          const step = calls.step;
          if (step === undefined) {
            operands.pop(); // remove from the stack
            calls.step = 0;
          } else {
            operands.push(toValue(parameters.length === 0));
            calls.pop();
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
  it('is immediately removed from call stack if step is not used and no subsequent call', () => {
    pushFunctionOperatorToCallStack({
      implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
        operands.push(toValue(true));
      }
    });
    state.cycle();
    expect(state.calls.length).toStrictEqual(0);
    expect(state.operands.ref).toStrictEqual([toValue(true)]);
  });

  it('is not removed from call stack when step is used until set to STEP_DONE', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.step === undefined) {
          calls.step = 1;
          operands.push(toValue(1));
        } else {
          calls.step = STEP_DONE;
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

  it('continues to execute the operator after subsequent call until step is STEP_DONE', () => {
    pushFunctionOperatorToCallStack({
      implementation({ calls, operands }: IInternalState /*, parameters: readonly Value[]*/) {
        if (calls.step === undefined) {
          calls.step = 1;
          operands.push(toValue(1));
          pushFunctionOperatorToCallStack({
            implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
              operands.push(toValue(2));
            }
          });
        } else {
          calls.step = STEP_DONE;
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

  // it('does not trigger catch if the exception is raised within implementation', () => {
  //   pushFunctionOperatorToCallStack({
  //     implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
  //       operands.push(toValue(1));
  //       throw new InternalException('KO');
  //     },
  //     catch({ operands }: IInternalState /*, e: IException*/) {
  //       operands.push(toValue('Not supposed to be called'));
  //     }
  //   });
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(1);
  //   expect(state.operands.ref).toStrictEqual([toValue(1)]);
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(0);
  // });

  // it('does not trigger finally if the exception is raised within implementation', () => {
  //   pushFunctionOperatorToCallStack({
  //     implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
  //       operands.push(toValue(1));
  //       throw new InternalException('KO');
  //     },
  //     finally({ operands }: IInternalState) {
  //       operands.push(toValue('Not supposed to be called'));
  //     }
  //   });
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(1);
  //   expect(state.operands.ref).toStrictEqual([toValue(1)]);
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(0);
  // });

  // it('triggers catch when an exception is raised', () => {
  //   pushFunctionOperatorToCallStack({
  //     implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
  //       operands.push(toValue(1));
  //       pushFunctionOperatorToCallStack({
  //         implementation({ operands }: IInternalState /*, parameters: readonly Value[]*/) {
  //           operands.push(toValue(2));
  //           throw new InternalException('KO');
  //         }
  //       });
  //     },
  //     catch({ operands }: IInternalState /*, e: IException*/) {
  //       operands.push(toValue(3));
  //     }
  //   });
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(2);
  //   expect(state.operands.ref).toStrictEqual([toValue(1)]);
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(2);
  //   expect(state.operands.ref).toStrictEqual([toValue(2), toValue(1)]);
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(1);
  //   expect(state.operands.ref).toStrictEqual([toValue(3), toValue(2), toValue(1)]);
  //   state.cycle();
  //   expect(state.calls.length).toStrictEqual(0);
  // });

  it.skip('triggers finally before unstacking the operator (no exception)', () => {
    // from a callstack point of view, we need to know that the stack is coming from catch
  });

  it.skip('triggers finally before unstacking the operator (exception)', () => {});

  it.skip('triggers catch and then finally', () => {});
});
