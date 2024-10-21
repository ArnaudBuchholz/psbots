import { describe, it, expect } from 'vitest';
import type { OperatorValue, StringValue, Value, IValuePermissions, IntegerValue, NameValue } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { testCheckFunction, enumVariantsOf, values, toValue } from '@test/index.js';
import {
  checkIntegerValue,
  checkStringValue,
  checkOperatorValue,
  checkArrayValue,
  checkDictionaryValue,
  checkNameValue
} from '@sdk/checks/checkValue.js';
import { toIntegerValue, toNameValue, toStringValue } from '@sdk/toValue';

function testFlags(
  check: (value: unknown, flags?: Partial<IValuePermissions>) => void,
  values: Value[],
  flags: (keyof IValuePermissions)[]
): void {
  flags.forEach((flag) => {
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
        trueValues.forEach((value) => expect(() => check(value, { [flag]: true })).not.toThrowError());
      });
      it('accepts only values with matching flag (false)', () => {
        falseValues.forEach((value) => expect(() => check(value, { [flag]: false })).not.toThrowError());
      });
      it('rejects values with non matching flag (true)', () => {
        falseValues.forEach((value) => expect(() => check(value, { [flag]: true })).toThrowError());
      });
      it('rejects only values with matching flag (false)', () => {
        trueValues.forEach((value) => expect(() => check(value, { [flag]: false })).toThrowError());
      });
    });
  });
}

describe('checkIntegerValue', () => {
  const integerValue = toIntegerValue(123);

  testCheckFunction<IntegerValue>({
    check: checkIntegerValue,
    valid: [integerValue],
    invalid: [...values.all, ...enumVariantsOf(integerValue)]
  });
});

describe('checkStringValue', () => {
  const stringValue = toStringValue('test');
  const executableStringValue = toStringValue('test', { isExecutable: true });

  testCheckFunction<StringValue>({
    check: checkStringValue,
    valid: [stringValue, executableStringValue],
    invalid: [...values.all, ...enumVariantsOf(stringValue), ...enumVariantsOf(executableStringValue)]
  });

  testFlags(checkStringValue, [stringValue, executableStringValue], ['isExecutable']);
});

describe('checkNameValue', () => {
  const nameValue = toNameValue('test');
  const executableNameValue = toNameValue('test', { isExecutable: true });

  testCheckFunction<NameValue>({
    check: checkNameValue,
    valid: [nameValue, executableNameValue],
    invalid: [...values.all, ...enumVariantsOf(nameValue), ...enumVariantsOf(executableNameValue)]
  });

  testFlags(checkNameValue, [nameValue, executableNameValue], ['isExecutable']);
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

describe('checkArrayValue', () => {
  const readOnlyArrayValue = toValue([1, 2, 3], { isReadOnly: true });
  const arrayValue = toValue([1, 2, 3]);
  const executableBlock = toValue([1, 2, 3], { isReadOnly: true, isExecutable: true });

  testCheckFunction({
    check: checkArrayValue,
    valid: [readOnlyArrayValue, arrayValue, executableBlock],
    invalid: [
      ...values.all,
      ...enumVariantsOf(readOnlyArrayValue),
      ...enumVariantsOf(arrayValue),
      ...enumVariantsOf(executableBlock)
    ]
  });

  testFlags(checkArrayValue, [readOnlyArrayValue, arrayValue, executableBlock], ['isReadOnly', 'isExecutable']);
});

describe('checkDictionaryValue', () => {
  const readOnlyDictionaryValue = toValue({ a: 1, b: 2, c: 3 }, { isReadOnly: true });
  const dictionaryValue = toValue({ a: 1, b: 2, c: 3 });

  testCheckFunction({
    check: checkDictionaryValue,
    valid: [readOnlyDictionaryValue, dictionaryValue],
    invalid: [...values.all, ...enumVariantsOf(readOnlyDictionaryValue), ...enumVariantsOf(dictionaryValue)]
  });

  testFlags(checkDictionaryValue, [readOnlyDictionaryValue, dictionaryValue], ['isReadOnly']);
});
