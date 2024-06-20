import { describe, it, expect } from 'vitest';
import type { StringValue } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { testCheckFunction, enumVariantsOf, values } from '@test/index.js';
import { checkStringValue } from '@sdk/checks/checkValue.js';

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
    invalid: [
      ...values.numbers,
      ...values.functions,
      ...enumVariantsOf(stringValue),
      ...enumVariantsOf(executableStringValue)
    ]
  });

  describe('executable flag', () => {
    describe('non executable string', () => {
      it('validates the string when executable flag is false', () => {
        expect(() => checkStringValue(stringValue, false)).not.toThrowError();
      });

      it('rejects the string when executable flag is true', () => {
        expect(() => checkStringValue(stringValue, true)).toThrowError();
      });
    });

    describe('executable string', () => {
      it('validates the executable string when executable flag is true', () => {
        expect(() => checkStringValue(executableStringValue, true)).not.toThrowError();
      });

      it('rejects the executable string when executable flag is false', () => {
        expect(() => checkStringValue(executableStringValue, false)).toThrowError();
      });
    });
  });
});
