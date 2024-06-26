import { describe, it, expect } from 'vitest';
import type { ArrayValue, OperatorValue, StringValue } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { testCheckFunction, enumVariantsOf, values, toValue } from '@test/index.js';
import { checkStringValue, checkOperatorValue, checkArrayValue } from '@sdk/checks/checkValue.js';

describe('checkStringValue', () => {
  const stringValue: StringValue = {
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: false,
    string: 'test'
  };

  const executableStringValue: StringValue = {
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: true,
    string: 'test'
  };

  testCheckFunction<StringValue>({
    check: checkStringValue,
    valid: [stringValue, executableStringValue],
    invalid: [...values.all, ...enumVariantsOf(stringValue), ...enumVariantsOf(executableStringValue)]
  });

  describe('executable flag', () => {
    describe('non executable string', () => {
      it('validates the string when executable flag is false', () => {
        expect(() => checkStringValue(stringValue, { isExecutable: false })).not.toThrowError();
      });

      it('rejects the string when executable flag is true', () => {
        expect(() => checkStringValue(stringValue, { isExecutable: true })).toThrowError();
      });
    });

    describe('executable string', () => {
      it('validates the executable string when executable flag is true', () => {
        expect(() => checkStringValue(executableStringValue, { isExecutable: true })).not.toThrowError();
      });

      it('rejects the executable string when executable flag is false', () => {
        expect(() => checkStringValue(executableStringValue, { isExecutable: false })).toThrowError();
      });
    });
  });
});

describe('checkOperatorValue', () => {
  const operatorValue: OperatorValue = {
    type: ValueType.operator,
    isReadOnly: true,
    isExecutable: true,
    operator: {
      name: 'test'
    }
  };

  testCheckFunction<OperatorValue>({
    check: checkOperatorValue,
    valid: [operatorValue],
    invalid: [...values.all, ...enumVariantsOf(operatorValue)]
  });
});

describe('checkArrayValue', () => {
  const readOnlyArrayValue = toValue([1, 2, 3]) as ArrayValue;

  testCheckFunction<ArrayValue>({
    check: checkArrayValue,
    valid: [readOnlyArrayValue],
    invalid: [...values.all, ...values.functions, ...enumVariantsOf(readOnlyArrayValue)]
  });
});
