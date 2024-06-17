import { describe, it, expect } from 'vitest';
import { toString } from '@sdk/toString.js';
import { toValue, values, stringify } from '@test/index.js';
import { ValueType } from '@api/values';

const stringValue = toValue('Hello World !');
const executableStringValue = Object.assign(toValue('exec'), { isExecutable: true });

describe('simple', () => {
  [
    ...values.booleans,
    ...values.negativeIntegers,
    ...values.positiveIntegers
  ].forEach(value => {
    it(`converts primitive value (${stringify(value)})`, () => {
      expect(toString(toValue(value))).toStrictEqual(value.toString());
    });
  });

  it('converts non executable string value', () => {
    expect(toString(stringValue)).toStrictEqual('"Hello World !"');
  });

  it('converts executable string value', () => {
    expect(toString(executableStringValue)).toStrictEqual('exec');
  });

  it('converts spaced executable string value', () => {
    expect(toString(Object.assign(toValue('spaced exec'), { isExecutable: true }))).toStrictEqual('spaced␣exec');
  });

  it('converts mark', () => {
    expect(toString(toValue.mark)).toStrictEqual('--mark--');
  });

  it('converts operator', () => {
    expect(toString(toValue.operator)).toStrictEqual('-operator-');
  })
});
