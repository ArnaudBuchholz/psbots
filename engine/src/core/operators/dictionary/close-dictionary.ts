import { USER_MEMORY_TYPE, ValueType } from '@api/index.js';
import { checkNameValue, findMarkPos, TypeCheckException, valuesOf } from '@sdk/index.js';
import type { IInternalState } from '@sdk/index.js';
import { buildFunctionOperator } from '@core/operators/operators.js';
import { pushOpenClosedValueWithDebugInfo } from '@core/operators/open-close.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';

buildFunctionOperator(
  {
    name: '>>',
    aliases: ['»', 'dicttomark'],
    description: 'finalizes a dictionary',
    labels: ['dictionary', 'mark'],
    signature: {
      input: [],
      output: []
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
    const markPos = findMarkPos(operands);
    if (markPos % 2 !== 0) {
      throw new TypeCheckException();
    }
    for (let operandIndex = 1; operandIndex < markPos; operandIndex += 2) {
      const name = operands.ref[operandIndex]!; // markPos was verified
      if (name.type !== ValueType.name) {
        throw new TypeCheckException();
      }
    }
    const { top: closeOp } = calls;
    const dictionary = new Dictionary(memoryTracker as MemoryTracker, USER_MEMORY_TYPE);
    try {
      for (let operandIndex = 0; operandIndex < markPos; operandIndex += 2) {
        const value = operands.top;
        value.tracker?.addValueRef(value);
        operands.pop();
        checkNameValue(operands.top);
        const [name] = valuesOf<ValueType.name>(operands.top);
        operands.pop();
        dictionary.def(name, value);
        value.tracker?.releaseValue(value);
      }
      const { top: mark } = operands;
      operands.pop();
      pushOpenClosedValueWithDebugInfo({
        operands,
        value: dictionary.toValue({ isReadOnly: false }),
        mark,
        closeOp
      });
    } finally {
      dictionary.release();
    }
  }
);
