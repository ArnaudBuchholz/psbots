import { describe, it, expect } from 'vitest';
import type { IDebugSource, IReadOnlyCallStack, Value } from '@api/index.js';
import { markValue, nullValue } from '@api/index.js';
import {
  callStackToString,
  valueToString,
  TOSTRING_BEGIN_MARKER,
  TOSTRING_END_MARKER,
  TOSTRING_NULL
} from '@sdk/toString.js';
import {
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_UNKNOWN
} from '@sdk/interfaces/ICallStack.js';
import { toValue, values, stringify } from '@test/index.js';

describe('basic conversion', () => {
  it('converts null', () => {
    expect(valueToString(nullValue)).toStrictEqual(TOSTRING_NULL);
  });

  for (const value of [...values.booleans, ...values.negativeIntegers, ...values.positiveIntegers]) {
    it(`converts a primitive value (${stringify(value)})`, () => {
      expect(valueToString(toValue(value))).toStrictEqual(value.toString());
    });
  }

  it('converts a non executable string value', () => {
    expect(valueToString(toValue('Hello World !'))).toStrictEqual('"Hello World !"');
  });

  it('converts an executable string value', () => {
    expect(valueToString(toValue('Hello World !', { isExecutable: true }))).toStrictEqual('Hello World !');
  });

  it('converts a non executable name value', () => {
    expect(valueToString(toValue(Symbol.for('test')))).toStrictEqual('/test');
  });

  it('converts a spaced non executable name value', () => {
    expect(valueToString(toValue(Symbol.for('test 2')))).toStrictEqual('/test␣2');
  });

  it('converts an executable name value', () => {
    expect(valueToString(toValue(Symbol.for('test'), { isExecutable: true }))).toStrictEqual('test');
  });

  it('converts a spaced executable name value', () => {
    expect(valueToString(toValue(Symbol.for('test 2'), { isExecutable: true }))).toStrictEqual('test␣2');
  });

  it('converts a mark', () => {
    expect(valueToString(markValue)).toStrictEqual('--mark--');
  });

  it('converts an operator', () => {
    expect(valueToString(toValue.operator)).toStrictEqual('-operator-');
  });

  it('converts a non executable array', () => {
    expect(valueToString(toValue([1, 2, 3]))).toStrictEqual('[ 1 2 3 ]');
  });

  it('converts a non executable array with null', () => {
    const arrayValue = toValue([1, 2, 3]);
    const { at } = arrayValue.array;
    arrayValue.array.at = (index) => {
      if (index === 1) {
        return nullValue;
      }
      return at.call(arrayValue.array, index);
    };
    expect(valueToString(arrayValue)).toStrictEqual('[ 1 ␀ 3 ]');
  });

  it('converts an executable array', () => {
    expect(valueToString(toValue([1, 2, 3], { isExecutable: true }))).toStrictEqual('{ 1 2 3 }');
  });

  it('summarizes a dictionary (ro)', () => {
    expect(valueToString(toValue({ a: 1 }, { isReadOnly: true }))).toStrictEqual('--dictionary(1)--');
  });

  it('summarizes a dictionary (r/w)', () => {
    expect(valueToString(toValue({ a: 1 }))).toStrictEqual('--dictionary(1/∞)--');
  });
});

describe('conversion with debug information', () => {
  it('does not append debug information if no options is given', () => {
    expect(
      valueToString(
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
      valueToString(
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
      valueToString(
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
      valueToString(
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

  it('hides debug info if not enough space', () => {
    expect(
      valueToString(
        Object.assign(toValue.operator, {
          debugSource: <IDebugSource>{
            source: 'true { operator } if',
            filename: 'test.ps',
            length: 8,
            pos: 7
          }
        }),
        {
          includeDebugSource: true,
          maxWidth: 4
        }
      )
    ).toStrictEqual('-op…');
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
    expect(valueToString(operator(), { maxWidth: 50 })).toStrictEqual('-operator-');
  });

  it('does not limit the width if wide enough (debug information included)', () => {
    expect(valueToString(operator(), { includeDebugSource: true, maxWidth: 50 })).toStrictEqual(
      '-operator-@folder/test.ps:3:3'
    );
  });

  it('limits the width of the value when no debug information is needed', () => {
    expect(valueToString(operator(), { maxWidth: 5 })).toStrictEqual('-ope…');
  });

  it('limits the width of the value and debug information', () => {
    expect(valueToString(operator(), { includeDebugSource: true, maxWidth: 20 })).toStrictEqual('-oper…@…/test.ps:3:3');
  });

  it('limits the width of the debug information', () => {
    expect(valueToString(operator(), { includeDebugSource: true, maxWidth: 25 })).toStrictEqual('-operator-@…/test.ps:3:3');
  });

  it('limits the width of the value when the debug information cannot be reduced', () => {
    expect(valueToString(operator('test.ps'), { includeDebugSource: true, maxWidth: 20 })).toStrictEqual(
      '-operat…@test.ps:3:3'
    );
  });
});

describe('operatorState', () => {
  describe('string', () => {
    const string = `/factorial
{
  %% check stack
  count 1 lt { stackunderflow } if
  dup type /integer neq { typecheck } if

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
      expect(
        valueToString(toValue(string, { isExecutable: true }), { operatorState: OPERATOR_STATE_UNKNOWN })
      ).toStrictEqual(string);
    });

    it('converts string and indicate current position (OPERATOR_STATE_FIRST_CALL)', () => {
      expect(
        valueToString(toValue(string, { isExecutable: true }), { operatorState: OPERATOR_STATE_FIRST_CALL })
      ).toStrictEqual(
        `${TOSTRING_BEGIN_MARKER}/factorial${TOSTRING_END_MARKER}
{
  %% check stack
  count 1 lt { stackunderflow } if
  dup type /integer neq { typecheck } if

  1 exch
  %% result n
  {
    dup 2 lt { pop stop } if
    dup 3 1 roll mul
    exch
    1 sub
  } loop
} bind def

`
      );
    });

    it('converts string and indicate current position (operator state is 11)', () => {
      expect(valueToString(toValue(string, { isExecutable: true }), { operatorState: 11 })).toStrictEqual(
        `/factorial
${TOSTRING_BEGIN_MARKER}{${TOSTRING_END_MARKER}
  %% check stack
  count 1 lt { stackunderflow } if
  dup type /integer neq { typecheck } if

  1 exch
  %% result n
  {
    dup 2 lt { pop stop } if
    dup 3 1 roll mul
    exch
    1 sub
  } loop
} bind def

`
      );
    });

    it('centers string on current item when width is limited', () => {
      expect(valueToString(toValue(string, { isExecutable: true }), { operatorState: 142, maxWidth: 40 })).toStrictEqual(
        `…sult n\n  {\n    dup ${TOSTRING_BEGIN_MARKER}2${TOSTRING_END_MARKER} lt { pop stop }…`
      );
    });

    it('centers string on current item when width is limited (selected is larger than maxWidth)', () => {
      expect(valueToString(toValue(string, { isExecutable: true }), { operatorState: 45, maxWidth: 10 })).toStrictEqual(
        `… ${TOSTRING_BEGIN_MARKER}stacku…`
      );
    });

    it('converts string and indicate current position (operator state is 11, maxWidth set to 40)', () => {
      expect(valueToString(toValue(string, { isExecutable: true }), { operatorState: 11, maxWidth: 40 })).toStrictEqual(
        `/factorial
${TOSTRING_BEGIN_MARKER}{${TOSTRING_END_MARKER}
  %% check stack
  count…`
      );
    });

    it('converts string and indicate current position (operator state is 219, maxWidth set to 40)', () => {
      expect(valueToString(toValue(string, { isExecutable: true }), { operatorState: 219, maxWidth: 40 })).toStrictEqual(
        `… exch
    1 sub
  } loop
} bind ${TOSTRING_BEGIN_MARKER}def${TOSTRING_END_MARKER}

`
      );
    });

    it('converts string and indicate current position (operator state is 219, maxWidth set to 40, includeDebugSource)', () => {
      expect(
        valueToString(
          Object.assign(
            {
              debugSource: <IDebugSource>{
                source: string,
                filename: 'test.ps',
                length: string.length,
                pos: 0
              }
            },
            toValue(string, { isExecutable: true })
          ),
          {
            operatorState: 219,
            maxWidth: 40,
            includeDebugSource: true
          }
        )
      ).toStrictEqual(
        `…sub
  } loop
} bind ${TOSTRING_BEGIN_MARKER}def${TOSTRING_END_MARKER}

@test.ps:1:1`
      );
    });
  });

  describe('operator', () => {
    it('converts an operator with OPERATOR_STATE_UNKNOWN', () => {
      expect(
        valueToString(toValue.operator, {
          operatorState: OPERATOR_STATE_UNKNOWN
        })
      ).toStrictEqual('-operator-');
    });

    it('converts an operator with OPERATOR_STATE_FIRST_CALL', () => {
      expect(
        valueToString(toValue.operator, {
          operatorState: OPERATOR_STATE_FIRST_CALL
        })
      ).toStrictEqual('-operator-');
    });

    it('converts an operator with operator state 12', () => {
      expect(
        valueToString(toValue.operator, {
          operatorState: 12
        })
      ).toStrictEqual(`-operator-${TOSTRING_BEGIN_MARKER}12`);
    });

    it('converts an operator with OPERATOR_STATE_CALL_BEFORE_POP', () => {
      expect(
        valueToString(toValue.operator, {
          operatorState: OPERATOR_STATE_CALL_BEFORE_POP
        })
      ).toStrictEqual(`-operator-${TOSTRING_END_MARKER}`);
    });

    it('converts an operator with operator state -12', () => {
      expect(
        valueToString(toValue.operator, {
          operatorState: -12
        })
      ).toStrictEqual(`-operator-${TOSTRING_END_MARKER}-12`);
    });

    it('converts an operator with OPERATOR_STATE_POP', () => {
      expect(
        valueToString(toValue.operator, {
          operatorState: OPERATOR_STATE_POP
        })
      ).toStrictEqual(`-operator-${TOSTRING_END_MARKER}${TOSTRING_END_MARKER}`);
    });
  });

  describe('executable array', () => {
    const array = toValue([toValue.operator, 2, 3], { isExecutable: true });

    it('converts an executable array with OPERATOR_STATE_UNKNOWN', () => {
      expect(
        valueToString(array, {
          operatorState: OPERATOR_STATE_UNKNOWN
        })
      ).toStrictEqual('{ -operator- 2 3 }');
    });

    it('converts an executable array with OPERATOR_STATE_FIRST_CALL', () => {
      expect(
        valueToString(array, {
          operatorState: OPERATOR_STATE_FIRST_CALL
        })
      ).toStrictEqual(`{ ${TOSTRING_BEGIN_MARKER}-operator-${TOSTRING_END_MARKER} 2 3 }`);
    });

    it('converts an executable array with operator state 1', () => {
      expect(
        valueToString(array, {
          operatorState: 1
        })
      ).toStrictEqual(`{ -operator- ${TOSTRING_BEGIN_MARKER}2${TOSTRING_END_MARKER} 3 }`);
    });
  });
});

describe('call stack', () => {
  it('converts an IReadOnlyCallStack to an array of strings', () => {
    const callStack: IReadOnlyCallStack = {
      length: 2,
      at(index) {
        if (index === 0) {
          return toValue('abc');
        }
        return toValue(Symbol.for('abc'));
      },
      operatorStateAt(/*index*/) {
        return 0;
      },
      topOperatorState: 0
    };
    expect(callStackToString(callStack)).toStrictEqual(['"abc"', '/abc']);
  });
});
