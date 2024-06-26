import { testCheckFunction, values } from '@test/index.js';
import { isObject } from '@sdk/checks/isObject.js';

testCheckFunction<object>({
  check: (value) => {
    if (!isObject(value)) {
      throw new Error();
    }
  },
  valid: [{}, /test/, []],
  invalid: [null, ...values.numbers, ...values.functions, '', 'Hello World !']
});
