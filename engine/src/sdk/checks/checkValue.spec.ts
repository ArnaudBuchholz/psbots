import { describe, it, expect } from 'vitest';
import type { OperatorValue, StringValue, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { testCheckFunction, enumVariantsOf, values, toValue } from '@test/index.js';
import type { CheckableFlags } from '@sdk/checks/checkValue.js';
import { checkStringValue, checkOperatorValue, checkArrayValue } from '@sdk/checks/checkValue.js';

function testFlags(
  check: (value: unknown, flags?: CheckableFlags) => void,
  values: Value[],
  flags: (keyof CheckableFlags)[]
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
        trueValues.forEach((value) => expect(() => check(value, { [flag]: true })).not.toThrowError);
      });
      it('accepts only values with matching flag (false)', () => {
        falseValues.forEach((value) => expect(() => check(value, { [flag]: false })).not.toThrowError);
      });
      it('rejects values with non matching flag (true)', () => {
        falseValues.forEach((value) => expect(() => check(value, { [flag]: true })).toThrowError);
      });
      it('rejects only values with matching flag (false)', () => {
        trueValues.forEach((value) => expect(() => check(value, { [flag]: false })).toThrowError);
      });
    });
  });
}

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

  testFlags(checkStringValue, [stringValue, executableStringValue], ['isExecutable']);
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
  const readOnlyArrayValue = toValue([1, 2, 3], true);
  const arrayValue = toValue([1, 2, 3]);
  const executableBlock = Object.assign(
    toValue([1, 2, 3], true),
    { isExecutable: true }
  );

  testCheckFunction({
    check: checkArrayValue,
    valid: [readOnlyArrayValue, arrayValue, executableBlock],
    invalid: [
      ...values.all,
      ...enumVariantsOf(readOnlyArrayValue),
      ...enumVariantsOf(arrayValue),
      ...enumVariantsOf(executableBlock),
    ]
  });

  testFlags(checkArrayValue, [readOnlyArrayValue, arrayValue, executableBlock], ['isReadOnly', 'isExecutable']);
});
