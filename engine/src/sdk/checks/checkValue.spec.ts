import { describe } from 'vitest';
import type { StringValue } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { testCheckFunction, enumVariantsOf, numbers, functions } from '@test/index.js';
import { checkStringValue } from '@sdk/checks/checkValue.js';

describe('checkStringValue', () => {
  const stringValue: StringValue = {
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: false,
    isShared: false,
    string: 'test'
  };

  const executableStringValue: StringValue = {
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: true,
    isShared: false,
    string: 'test'
  };

  testCheckFunction<StringValue>({
    check: checkStringValue,
    valid: [stringValue, executableStringValue],
    invalid: [...numbers, ...functions, ...enumVariantsOf(stringValue), ...enumVariantsOf(executableStringValue)]
  });
});
