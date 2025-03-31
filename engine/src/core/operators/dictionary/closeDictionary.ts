import type { NameValue } from '@api/index.js';
import { USER_MEMORY_TYPE, ValueType } from '@api/index.js';
import { findMarkPos, valuesOf } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { pushOpenClosedValueWithDebugInfo } from '@core/operators/openClose.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

buildFunctionOperator(
  {
    name: '>>',
    aliases: ['»', 'dicttomark'],
    description: 'finalizes a dictionary',
    labels: ['dictionary', 'mark'],
    signature: {
      output: [{ type: ValueType.dictionary, permissions: { isExecutable: false, isReadOnly: false } }]
    },
    samples: [
      {
        description: 'builds a dictionary check length and type',
        in: '<< /test 123 >> dup length exch type',
        out: '1 /dictionary'
      },
      {
        description: 'builds a dictionary check length and type',
        in: '« /test 123 » dup length exch type',
        out: '1 /dictionary'
      },
      {
        description: 'builds a read/write dictionary',
        in: '« /test 123 » wcheck',
        out: 'true'
      },
      {
        description: 'builds a dictionary check length and type',
        in: 'mark /test 123 dicttomark dup length exch type',
        out: '1 /dictionary'
      },
      {
        description: 'builds a dictionary with shared values, check length and type',
        in: '<< /test 123 /test_array [ ] /test_dictionary << >> >> dup length exch type',
        out: '3 /dictionary'
      },
      {
        description: 'allocates an empty dictionary',
        in: '<<>> dup length exch type',
        out: '0 /dictionary'
      },
      {
        description: 'fails if the corresponding dictionary start does not exist',
        in: '/test 123 >>',
        out: '/test 123 unmatchedmark'
      },
      {
        description: 'fails if the dictionary definition is invalid (names must be strings)',
        in: '<< 123 /test >>',
        out: 'mark 123 /test typecheck'
      },
      {
        description: 'fails if the dictionary definition is invalid (missing name value pair)',
        in: '<< /test 123 /missing_value >>',
        out: 'mark 123 /test /missing_value typecheck'
      }
    ]
  },
  (state: IInternalState) => {
    const { operands, memoryTracker, calls } = state;
    const markPosResult = findMarkPos(operands);
    if (!markPosResult.success) {
      return markPosResult;
    }
    const markPos = markPosResult.value;
    if (markPos % 2 !== 0) {
      return { success: false, exception: 'typeCheck' };
    }
    for (let operandIndex = 1; operandIndex < markPos; operandIndex += 2) {
      const name = operands.at(operandIndex);
      if (name.type !== ValueType.name) {
        return { success: false, exception: 'typeCheck' };
      }
    }
    const { top: closeOp } = calls;
    const dictionaryResult = Dictionary.create(memoryTracker as MemoryTracker, USER_MEMORY_TYPE, markPos / 2);
    if (!dictionaryResult.success) {
      return dictionaryResult;
    }
    const dictionary = dictionaryResult.value;
    for (let operandIndex = 0; operandIndex < markPos; operandIndex += 2) {
      const value = operands.at(operandIndex);
      const nameValue = operands.at(operandIndex + 1);
      const [name] = valuesOf<ValueType.name>(nameValue as NameValue); // checked before
      const defined = dictionary.def(name, value);
      if (!defined.success) {
        return defined;
      }
    }
    const pushResult = pushOpenClosedValueWithDebugInfo({
      operands,
      popCount: markPos + 1,
      value: dictionary.toValue({ isReadOnly: false }),
      mark: operands.at(markPos),
      closeOp
    });
    dictionary.release();
    return pushResult;
  }
);
