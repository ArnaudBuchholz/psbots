import { describe, it, expect } from 'vitest';
import type { IDebugSource, Value } from '@api/index.js';
import { toString } from '@sdk/toString.js';
import { toValue, values, stringify } from '@test/index.js';

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
    const arrayValue = toValue([1, 2, 3]);
    const { at } = arrayValue.array;
    arrayValue.array.at = (index) => {
      if (index === 1) {
        return null;
      }
      return at.call(arrayValue.array, index);
    };
    expect(toString(arrayValue)).toStrictEqual('[ 1 ␀ 3 ]');
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
  const operator = (filename = 'folder/test.ps'): Value =>
    Object.assign(toValue.operator, {
      debugSource: <IDebugSource>{
        source: `true
{
  operator
}
if`,
        filename,
        length: 8,
        pos: 9
      }
    });

  it('does not limit the width if wide enough', () => {
    expect(toString(operator(), { maxWidth: 50 })).toStrictEqual('-operator-');
  });

  it('does not limit the width if wide enough (debug information included)', () => {
    expect(toString(operator(), { includeDebugSource: true, maxWidth: 50 })).toStrictEqual(
      '-operator-@folder/test.ps:3:3'
    );
  });

  it('limits the width of the value when no debug information is needed', () => {
    expect(toString(operator(), { maxWidth: 5 })).toStrictEqual('-ope…');
  });

  it('limits the width of the value and debug information', () => {
    expect(toString(operator(), { includeDebugSource: true, maxWidth: 20 })).toStrictEqual('-oper…@…/test.ps:3:3');
  });

  it('limits the width of the debug information', () => {
    expect(toString(operator(), { includeDebugSource: true, maxWidth: 25 })).toStrictEqual('-operator-@…/test.ps:3:3');
  });

  it('limits the width of the value when the debug information cannot be reduced', () => {
    expect(toString(operator('test.ps'), { includeDebugSource: true, maxWidth: 20 })).toStrictEqual(
      '-operat…@test.ps:3:3'
    );
  });
});
