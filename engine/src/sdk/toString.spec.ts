import { describe, it, expect, beforeAll } from 'vitest';
import type { IDebugSource, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { toString } from '@sdk/toString.js';
import { toValue, values, stringify, toIReadOnlyArray } from '@test/index.js';

const stringValue = toValue('Hello World !');
const executableStringValue = Object.assign(toValue('exec'), { isExecutable: true });

describe('basic conversion', () => {
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

describe('conversion with debug information', () => {
  it('does not append debug information if no options is given', () => {
    expect(
      toString(
        Object.assign(toValue.operator, {
          debugSource: <IDebugSource>{
            source: 'true { operator } if',
            filename: 'test.ps',
            length: 8,
            pos: 7
          }
        })
      )
    ).toStrictEqual('-operator-');
  });

  it('appends debug information if requested', () => {
    expect(
      toString(
        Object.assign(toValue.operator, {
          debugSource: <IDebugSource>{
            source: 'true { operator } if',
            filename: 'test.ps',
            length: 8,
            pos: 7
          }
        }),
        {
          includeDebugSource: true
        }
      )
    ).toStrictEqual('-operator-@test.ps:1:8');
  });

  it('appends debug information if requested (multiline source)', () => {
    expect(
      toString(
        Object.assign(toValue.operator, {
          debugSource: <IDebugSource>{
            source: `true
{
  operator
}
if`,
            filename: 'test.ps',
            length: 8,
            pos: 9
          }
        }),
        {
          includeDebugSource: true
        }
      )
    ).toStrictEqual('-operator-@test.ps:3:3');
  });
});

describe('conversion with a limited width', () => {
  let operator: Value;

  beforeAll(() => {
    operator = Object.assign(toValue.operator, {
      debugSource: <IDebugSource>{
        source: `true
{
  operator
}
if`,
        filename: 'folder/test.ps',
        length: 8,
        pos: 9
      }
    });
  });

  it('limits the width of the value (no debug information)', () => {
    expect(toString(operator, { maxWidth: 5 })).toStrictEqual('-ope…');
  });

  it('limits the width of the value (debug information)', () => {
    expect(toString(operator, { includeDebugSource: true, maxWidth: 20 })).toStrictEqual('-oper…@…/test.ps:3:3');
  });
});
