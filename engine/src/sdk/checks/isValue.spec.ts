import { describe, it, expect } from 'vitest';
import type { OperatorValue, StringValue, Value, IValuePermissions, IntegerValue, NameValue } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { testIsFunction, enumVariantsOf, values, toValue } from '@test/index.js';
import {
  isIntegerValue,
  isStringValue,
  isOperatorValue,
  isArrayValue,
  isDictionaryValue,
  isNameValue,
  assert,
  toIntegerValue,
  toNameValue,
  toStringValue
} from '@sdk/index.js';

function testFlags(
  is: (value: unknown, flags?: Partial<IValuePermissions>) => void,
  values: Value[],
  flags: (keyof IValuePermissions)[]
): void {
  for (const flag of flags) {
    const trueValues = values.filter((value) => value[flag]);
    const falseValues = values.filter((value) => !value[flag]);
    describe(flag, () => {
      it('owns true example(s)', () => {
        expect(trueValues.length).not.toStrictEqual(0);
      });
      it('owns false example(s)', () => {
        expect(falseValues.length).not.toStrictEqual(0);
      });
      it('accepts only values with matching flag (true)', () => {
        for (const value of trueValues) {
          expect(is(value, { [flag]: true })).toStrictEqual(true);
        }
      });
      it('accepts only values with matching flag (false)', () => {
        for (const value of falseValues) {
          expect(is(value, { [flag]: false })).toStrictEqual(true);
        }
      });
      it('rejects values with non matching flag (true)', () => {
        for (const value of falseValues) {
          expect(is(value, { [flag]: true })).toStrictEqual(false);
        }
      });
      it('rejects only values with matching flag (false)', () => {
        for (const value of trueValues) {
          expect(is(value, { [flag]: false })).toStrictEqual(false);
        }
      });
    });
  }
}

describe('isIntegerValue', () => {
  const integerValueResult = toIntegerValue(123);
  assert(integerValueResult);
  const integerValue = integerValueResult.value;

  testIsFunction<IntegerValue>({
    is: isIntegerValue,
    valid: [integerValue],
    invalid: [...values.all, ...enumVariantsOf(integerValue)]
  });
});

describe('isStringValue', () => {
  const stringValue = toStringValue('test');
  const executableStringValue = toStringValue('test', { isExecutable: true });

  testIsFunction<StringValue>({
    is: isStringValue,
    valid: [stringValue, executableStringValue],
    invalid: [...values.all, ...enumVariantsOf(stringValue), ...enumVariantsOf(executableStringValue)]
  });

  testFlags(isStringValue, [stringValue, executableStringValue], ['isExecutable']);
});

describe('isNameValue', () => {
  const nameValue = toNameValue('test');
  const executableNameValue = toNameValue('test', { isExecutable: true });

  testIsFunction<NameValue>({
    is: isNameValue,
    valid: [nameValue, executableNameValue],
    invalid: [...values.all, ...enumVariantsOf(nameValue), ...enumVariantsOf(executableNameValue)]
  });

  testFlags(isNameValue, [nameValue, executableNameValue], ['isExecutable']);
});

describe('isOperatorValue', () => {
  const operatorValue: OperatorValue = {
    type: ValueType.operator,
    isReadOnly: true,
    isExecutable: true,
    operator: {
      name: 'test'
    }
  };

  testIsFunction<OperatorValue>({
    is: isOperatorValue,
    valid: [operatorValue],
    invalid: [
      ...values.all,
      ...enumVariantsOf(operatorValue),
      {
        type: ValueType.operator,
        isReadOnly: true,
        isExecutable: true,
        operator: {
          name: 1
        }
      }
    ]
  });
});

describe('isArrayValue', () => {
  const readOnlyArrayValue = toValue([1, 2, 3], { isReadOnly: true });
  const arrayValue = toValue([1, 2, 3]);
  const executableBlock = toValue([1, 2, 3], { isReadOnly: true, isExecutable: true });

  testIsFunction({
    is: isArrayValue,
    valid: [readOnlyArrayValue, arrayValue, executableBlock],
    invalid: [
      ...values.all,
      ...enumVariantsOf(readOnlyArrayValue),
      ...enumVariantsOf(arrayValue),
      ...enumVariantsOf(executableBlock)
    ]
  });

  testFlags(isArrayValue, [readOnlyArrayValue, arrayValue, executableBlock], ['isReadOnly', 'isExecutable']);
});

describe('isDictionaryValue', () => {
  const readOnlyDictionaryValue = toValue({ a: 1, b: 2, c: 3 }, { isReadOnly: true });
  const dictionaryValue = toValue({ a: 1, b: 2, c: 3 });

  testIsFunction({
    is: isDictionaryValue,
    valid: [readOnlyDictionaryValue, dictionaryValue],
    invalid: [...values.all, ...enumVariantsOf(readOnlyDictionaryValue), ...enumVariantsOf(dictionaryValue)]
  });

  testFlags(isDictionaryValue, [readOnlyDictionaryValue, dictionaryValue], ['isReadOnly']);
});
