import { testIsFunction, values } from '@test/index.js';
import { isObject } from '@sdk/checks/isObject.js';

testIsFunction<object>({
  is: isObject,
  valid: [{}, /test/, []],
  invalid: [null, ...values.numbers, ...values.functions, '', 'Hello World !']
});
