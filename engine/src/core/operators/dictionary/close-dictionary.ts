import { USER_MEMORY_TYPE, ValueType } from '@api/index.js';
import { findMarkPos, TypeCheckException, type IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { MemoryTracker } from '@core/MemoryTracker.js';

buildFunctionOperator(
  {
    name: '>>',
    aliases: ['»', 'dicttomark'],
    description: 'finalizes an array',
    labels: ['dictionary', 'mark'],
    signature: {
      input: [],
      output: []
    },
    samples: [
      {
        description: 'builds a dictionary check length and type',
        in: '<< test 123 >> dup length exch type',
        out: '1 "dictionary"'
      },
      {
        description: 'builds a dictionary check length and type',
        in: '« test 123 » dup length exch type',
        out: '1 "dictionary"'
      },
      {
        description: 'builds a dictionary check length and type',
        in: 'mark test 123 dicttomark dup length exch type',
        out: '1 "dictionary"'
      },
      {
        description: 'allocates an empty dictionary',
        in: '<<>> dup length exch type',
        out: '0 "dictionary"'
      },
      {
        description: 'fails if the corresponding dictionary start does not exist',
        in: '"test" 123 >>',
        out: '"test" 123 unmatchedmark'
      },
      {
        description: 'fails if the dictionary definition is invalid (names must be strings)',
        in: '<< 123 "test" >>',
        out: 'mark 123 "test" typecheck'
      },
      {
        description: 'fails if the dictionary definition is invalid (missing name value pair)',
        in: '<< "test" 123 "missing_value" >>',
        out: 'mark 123 "test" "missing_value" typecheck'
      }
    ]
  },
  (state: IInternalState) =>  {
    state.allowCall(); // TODO: won't work with dicttomark
    const { operands, memoryTracker, calls } = state;
    const markPos = findMarkPos(operands);
    if (markPos % 2 !== 0) {
      throw new TypeCheckException();
    }
    for (let operandIndex = 1; operandIndex < markPos; operandIndex += 2) {
      const name = operands.ref[operandIndex]!; // markPos was verified
      if (name.type !== ValueType.string) {
        throw new TypeCheckException();
      }
    }
    const { top: closeOp } = calls;
    const dictionary = new Dictionary(memoryTracker as MemoryTracker, USER_MEMORY_TYPE);
    for (let operandIndex = 0; operandIndex < markPos; operandIndex += 2) {
      const value = operands.top;
      operands.pop();
      const name =  operands.top;
      operands.pop();
      dictionary.
      const value = operands.ref[operandIndex]!; // markPos was verified
      if (value.type !== ValueType.string) {
        throw new TypeCheckException();
      }
    }



    const { top: mark } = operands;
    operands.pop();
    const dictionaryValue = dictionary.toValue();
    if (mark.debugSource && closeOp.debugSource) {
      operands.push(
        Object.assign(
          {
            debugSource: {
              ...mark.debugSource,
              length: closeOp.debugSource.pos - mark.debugSource.pos + closeOp.debugSource.length
            }
          },
          dictionaryValue
        )
      );
    } else {
      operands.push(dictionaryValue);
    }
  }
);
