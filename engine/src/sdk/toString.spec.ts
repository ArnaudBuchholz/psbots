import { describe, it, expect } from 'vitest';
import type { IDebugSource, Value } from '@api/index.js';
import { toString, TOSTRING_BEGIN_MARKER, TOSTRING_END_MARKER } from '@sdk/toString.js';
import {
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_UNKNOWN
} from '@sdk/interfaces/ICallStack.js';
import { toValue, values, stringify } from '@test/index.js';

describe('basic conversion', () => {
  [...values.booleans, ...values.negativeIntegers, ...values.positiveIntegers].forEach((value) => {
    it(`converts a primitive value (${stringify(value)})`, () => {
      expect(toString(toValue(value))).toStrictEqual(value.toString());
    });
  });

  it('converts a non executable string value', () => {
    expect(toString(toValue('Hello World !'))).toStrictEqual('"Hello World !"');
  });

  it('converts an executable string value', () => {
    expect(toString(toValue('Hello World !', { isExecutable: true }))).toStrictEqual('Hello World !');
  });

  it('converts a non executable name value', () => {
    expect(toString(toValue(Symbol.for('test')))).toStrictEqual('/test');
  });

  it('converts a spaced non executable name value', () => {
    expect(toString(toValue(Symbol.for('test 2')))).toStrictEqual('/test␣2');
  });

  it('converts an executable name value', () => {
    expect(toString(toValue(Symbol.for('test'), { isExecutable: true }))).toStrictEqual('test');
  });

  it('converts a spaced executable name value', () => {
    expect(toString(toValue(Symbol.for('test 2'), { isExecutable: true }))).toStrictEqual('test␣2');
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
    expect(toString(toValue([1, 2, 3], { isExecutable: true }))).toStrictEqual('{ 1 2 3 }');
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

  it('puts debug information only for the array itself', () => {
    expect(
      toString(
        Object.assign(
          toValue([
            Object.assign(toValue(1), {
              debugSource: <IDebugSource>{
                source: 'whatever',
                filename: 'test.ps',
                length: 1,
                pos: 7
              }
            }),
            2,
            3
          ]),
          {
            debugSource: <IDebugSource>{
              source: 'whatever',
              filename: 'test.ps',
              length: 1,
              pos: 7
            }
          }
        ),
        {
          includeDebugSource: true
        }
      )
    ).toStrictEqual('[ 1 2 3 ]@test.ps:1:8');
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

describe('operatorState', () => {
  describe('string', () => {
    const string = `"factorial"
{
  %% check stack
  count 1 lt { stackunderflow } if
  dup type "integer" neq { typecheck } if

  1 exch
  %% result n
  {
    dup 2 lt { pop stop } if
    dup 3 1 roll mul
    exch
    1 sub
  } loop
} bind def

`;

    it('converts string and indicate current position (OPERATOR_STATE_UNKNOWN)', () => {
      expect(toString(toValue(string), { operatorState: OPERATOR_STATE_UNKNOWN })).toStrictEqual(
        toString(toValue(string))
      );
    });

    it('converts string and indicate current position (OPERATOR_STATE_FIRST_CALL)', () => {
      expect(toString(toValue(string), { operatorState: OPERATOR_STATE_FIRST_CALL })).toStrictEqual(
        toString(
          toValue(`${TOSTRING_BEGIN_MARKER}"factorial"${TOSTRING_END_MARKER}
{
  %% check stack
  count 1 lt { stackunderflow } if
  dup type "integer" neq { typecheck } if

  1 exch
  %% result n
  {
    dup 2 lt { pop stop } if
    dup 3 1 roll mul
    exch
    1 sub
  } loop
} bind def

`)
        )
      );
    });

    it('converts string and indicate current position (operator state is 12)', () => {
      expect(toString(toValue(string), { operatorState: 12 })).toStrictEqual(
        toString(
          toValue(`"factorial"
${TOSTRING_BEGIN_MARKER}{${TOSTRING_END_MARKER}
  %% check stack
  count 1 lt { stackunderflow } if
  dup type "integer" neq { typecheck } if

  1 exch
  %% result n
  {
    dup 2 lt { pop stop } if
    dup 3 1 roll mul
    exch
    1 sub
  } loop
} bind def

`)
        )
      );
    });
  });

  describe('operator', () => {
    it('converts an operator with OPERATOR_STATE_UNKNOWN', () => {
      expect(
        toString(toValue.operator, {
          operatorState: OPERATOR_STATE_UNKNOWN
        })
      ).toStrictEqual('-operator-');
    });

    it('converts an operator with OPERATOR_STATE_FIRST_CALL', () => {
      expect(
        toString(toValue.operator, {
          operatorState: OPERATOR_STATE_FIRST_CALL
        })
      ).toStrictEqual('-operator-');
    });

    it('converts an operator with operator state 12', () => {
      expect(
        toString(toValue.operator, {
          operatorState: 12
        })
      ).toStrictEqual(`-operator-${TOSTRING_BEGIN_MARKER}12`);
    });

    it('converts an operator with OPERATOR_STATE_CALL_BEFORE_POP', () => {
      expect(
        toString(toValue.operator, {
          operatorState: OPERATOR_STATE_CALL_BEFORE_POP
        })
      ).toStrictEqual(`-operator-${TOSTRING_END_MARKER}`);
    });

    it('converts an operator with operator state -12', () => {
      expect(
        toString(toValue.operator, {
          operatorState: -12
        })
      ).toStrictEqual(`-operator-${TOSTRING_END_MARKER}-12`);
    });

    it('converts an operator with OPERATOR_STATE_POP', () => {
      expect(
        toString(toValue.operator, {
          operatorState: OPERATOR_STATE_POP
        })
      ).toStrictEqual(`-operator-${TOSTRING_END_MARKER}${TOSTRING_END_MARKER}`);
    });
  });

  describe('executable array', () => {
    const array = toValue([1, 2, 3], { isExecutable: true });

    it('converts an executable array with OPERATOR_STATE_UNKNOWN', () => {
      expect(
        toString(array, {
          operatorState: OPERATOR_STATE_UNKNOWN
        })
      ).toStrictEqual('{ 1 2 3 }');
    });

    it('converts an executable array with OPERATOR_STATE_FIRST_CALL', () => {
      expect(
        toString(array, {
          operatorState: OPERATOR_STATE_FIRST_CALL
        })
      ).toStrictEqual(`{ ${TOSTRING_BEGIN_MARKER}1${TOSTRING_END_MARKER} 2 3 }`);
    });

    it('converts an executable array with operator state 1', () => {
      expect(
        toString(array, {
          operatorState: 1
        })
      ).toStrictEqual(`{ 1 ${TOSTRING_BEGIN_MARKER}2${TOSTRING_END_MARKER} 3 }`);
    });
  });
});
