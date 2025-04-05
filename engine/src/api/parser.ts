import { ValueType } from './values/ValueType.js';
import type { Value } from './values/Value.js';
import { nullValue } from './values/NullValue.js';
import { assert } from '@sdk/assert.js';

type ParseOptions = {
  pos?: number;
  filename?: string;
};

type ParseOptionsWithSource = ParseOptions &
  Required<Pick<ParseOptions, 'pos'>> & {
    source: string;
  };

type AddDebugSourceOptions = ParseOptionsWithSource & {
  length: number;
};

function addDebugSource(value: Value, { source, filename, pos, length }: AddDebugSourceOptions): Value {
  if (filename === undefined) {
    return value;
  }
  return Object.assign({
    debugSource: {
      source,
      filename,
      pos,
      length
    },
    ...value
  });
}

function* parseString(options: ParseOptionsWithSource) {
  const { source, pos } = options;
  const endPos = source.indexOf('"', pos + 1);
  if (endPos === -1) {
    yield addDebugSource(nullValue, { ...options, length: 1 });
    return source.length;
  }
  yield addDebugSource(
    {
      type: ValueType.string,
      isReadOnly: true,
      isExecutable: false,
      string: source.slice(pos + 1, endPos)
    },
    { ...options, length: endPos - pos + 1 }
  );
  return endPos + 1;
}

function* parseNumber(options: ParseOptionsWithSource) {
  const { source, pos } = options;
  const first = source[pos];
  assert(first !== undefined);
  let endPos = pos + 1;
  while (endPos < source.length && '0123456789'.includes(source[endPos]!)) {
    ++endPos;
  }
  if (endPos === pos + 1 && '+-'.includes(first)) {
    // This is a name
    yield addDebugSource(
      {
        type: ValueType.name,
        isReadOnly: true,
        isExecutable: true,
        name: first
      },
      { ...options, length: 1 }
    );
    return endPos;
  }
  yield addDebugSource(
    {
      type: ValueType.integer,
      isReadOnly: true,
      isExecutable: false,
      integer: Number.parseInt(source.slice(pos, endPos))
    },
    { ...options, length: endPos - pos }
  );
  return endPos;
}

function* parseName(options: ParseOptionsWithSource) {
  const { source, pos } = options;
  const { length } = source;
  const first = source[pos];
  assert(first !== undefined);
  if ('[]{}«»'.includes(first)) {
    yield addDebugSource(
      {
        type: ValueType.name,
        isReadOnly: true,
        isExecutable: true,
        name: first
      },
      { ...options, length: 1 }
    );
    return pos + 1;
  }
  if (pos === length - 1) {
    yield first === '/'
      ? addDebugSource(
          {
            type: ValueType.name,
            isReadOnly: true,
            isExecutable: true,
            name: ''
          },
          { ...options, length: 1 }
        )
      : addDebugSource(
          {
            type: ValueType.name,
            isReadOnly: true,
            isExecutable: true,
            name: first
          },
          { ...options, length: 1 }
        );
    return pos + 1;
  }
  let endPos = pos + 1;
  const second = source[endPos];
  assert(second !== undefined);
  if (first === second && '<>'.includes(first)) {
    yield addDebugSource(
      {
        type: ValueType.name,
        isReadOnly: true,
        isExecutable: true,
        name: first === '<' ? '<<' : '>>'
      },
      { ...options, length: 2 }
    );
    return endPos + 1;
  }
  while (endPos < length) {
    const char = source[endPos];
    assert(char !== undefined);
    if (' \t\r\n%[]{}«»<>'.includes(char)) {
      break;
    }
    ++endPos;
  }
  yield first === '/'
    ? addDebugSource(
        {
          type: ValueType.name,
          isReadOnly: true,
          isExecutable: false,
          name: source.slice(pos + 1, endPos)
        },
        { ...options, length: endPos - pos }
      )
    : addDebugSource(
        {
          type: ValueType.name,
          isReadOnly: true,
          isExecutable: true,
          name: source.slice(pos, endPos)
        },
        { ...options, length: endPos - pos }
      );
  return endPos;
}

/** Returns nullValue if a syntax error is detected */
export function* parse(source: string, options?: ParseOptions): Generator<Value> {
  options = options ?? {};
  const { filename } = options;
  let { pos = 0 } = options;
  const { length } = source;
  while (pos < length) {
    const char = source[pos];
    assert(char !== undefined);
    if (' \t\r\n'.includes(char)) {
      ++pos;
      continue;
    }
    if (char === '%') {
      pos = source.indexOf('\n', pos);
      if (pos === -1) {
        return;
      }
      ++pos;
      continue;
    }
    if (char === '"') {
      pos = yield* parseString({ source, filename, pos });
    } else if ('-+0123456789'.includes(char)) {
      pos = yield* parseNumber({ source, filename, pos });
    } else {
      pos = yield* parseName({ source, filename, pos });
    }
  }
}
