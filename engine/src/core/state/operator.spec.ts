import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import type { IInternalState, IOperator } from '@sdk/index.js';
import { OperatorType, StackUnderflowException, TypeCheckException } from '@sdk/index.js';
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
  describe('specific parameter type', () => {
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
      state.calls.push({
        type: ValueType.operator,
        isExecutable: true,
        isReadOnly: true,
        operator: <IOperator>{
          name: 'test',
          type: OperatorType.implementation,
          implementation: function ({ operands }: IInternalState, parameters: Value[]) {
            operands.push(toValue(parameters.length === 1));
          },
          typeCheck: [null]
        }
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

      state.calls.push({
        type: ValueType.operator,
        isExecutable: true,
        isReadOnly: true,
        operator: <IOperator>{
          name: 'test',
          type: OperatorType.implementation,
          implementation: function ({ operands }: IInternalState /*, parameters: Value[]*/) {
            operands.push(toValue(sharedObject.refCount === 3));
          },
          typeCheck: [value.type]
        }
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
      state.calls.push({
        type: ValueType.operator,
        isExecutable: true,
        isReadOnly: true,
        operator: <IOperator>{
          name: 'test',
          type: OperatorType.implementation,
          implementation: function ({ calls, operands }: IInternalState, parameters: Value[]) {
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
        }
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
