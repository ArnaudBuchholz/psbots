import { describe, it, expect } from 'vitest';
import { toString } from '@sdk/toString.js';
import { toValue, values, stringify, toIReadOnlyArray } from '@test/index.js';
import { ValueType } from '@api/values';

const stringValue = toValue('Hello World !');
const executableStringValue = Object.assign(toValue('exec'), { isExecutable: true });

describe('simple', () => {
  [...values.booleans, ...values.negativeIntegers, ...values.positiveIntegers].forEach((value) => {
    it(`converts a primitive value (${stringify(value)})`, () => {
      expect(toString(toValue(value))).toStrictEqual(value.toString());
    });
  });

  it('converts a non executable string value', () => {
    expect(toString(stringValue)).toStrictEqual('"Hello World !"');
  });

  it('converts an executable string value', () => {
    expect(toString(executableStringValue)).toStrictEqual('exec');
  });

  it('converts a spaced executable string value', () => {
    expect(toString(Object.assign(toValue('spaced exec'), { isExecutable: true }))).toStrictEqual('spaced␣exec');
  });

  it('converts a mark', () => {
    expect(toString(toValue.mark)).toStrictEqual('--mark--');
  });

  it('converts an operator', () => {
    expect(toString(toValue.operator)).toStrictEqual('-operator-');
  });

  it('converts a non executable array', () => {
    expect(toString(toValue([1, 2, 3]))).toStrictEqual('[ 1 2 3 ]');
  });

  it('converts a non executable array with null', () => {
    const iArray = toIReadOnlyArray([1, 2, 3]);
    const { at } = iArray;
    iArray.at = (index) => {
      if (index === 1) {
        return null;
      }
      return at.call(iArray, index);
    };
    expect(
      toString({
        type: ValueType.array,
        isReadOnly: true,
        isExecutable: false,
        isShared: false,
        array: iArray
      })
    ).toStrictEqual('[ 1 ␀ 3 ]');
  });

  it('converts an executable array', () => {
    expect(toString(Object.assign(toValue([1, 2, 3]), { isExecutable: true }))).toStrictEqual('{ 1 2 3 }');
  });

  it('summarizes a dictionary', () => {
    expect(toString(toValue({ a: 1 }))).toStrictEqual('--dictionary(1)--');
  });
});
