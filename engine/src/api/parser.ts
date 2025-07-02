import type { Value } from './values/Value.js';
import { nullValue } from './values/NullValue.js';
import { assert } from '@sdk/assert.js';

type ParseOptions = {
  pos?: number;
  filename?: string;
};

type Parsed = {
  endPos: number;
  value: Value;
};

function parseString(source: string, pos: number): Parsed {
  const endPos = source.indexOf('"', pos + 1);
  if (endPos === -1) {
    // TODO: that should be an error
    return { endPos: source.length, value: nullValue };
  }
  return {
    endPos: endPos + 1,
    value: {
      type: 'string',
      isReadOnly: true,
      isExecutable: false,
      string: source.slice(pos + 1, endPos)
    }
  };
}

function parseNumber(source: string, pos: number): Parsed {
  const first = source[pos];
  assert(first !== undefined);
  let endPos = pos + 1;
  while (endPos < source.length && '0123456789'.includes(source[endPos]!)) {
    ++endPos;
  }
  if (endPos === pos + 1 && '+-'.includes(first)) {
    // This is a name
    return {
      endPos,
      value: {
        type: 'name',
        isReadOnly: true,
        isExecutable: true,
        name: first
      }
    };
  }
  return {
    endPos,
    value: {
      type: 'integer',
      isReadOnly: true,
      isExecutable: false,
      integer: Number.parseInt(source.slice(pos, endPos))
    }
  };
}

function parseName(source: string, pos: number): Parsed {
  const { length } = source;
  const first = source[pos];
  assert(first !== undefined);
  if ('[]{}«»'.includes(first)) {
    return {
      endPos: pos + 1,
      value: {
        type: 'name',
        isReadOnly: true,
        isExecutable: true,
        name: first
      }
    };
  }
  if (pos === length - 1) {
    return {
      endPos: pos + 1,
      value:
        first === '/'
          ? {
              type: 'name',
              isReadOnly: true,
              isExecutable: true,
              name: ''
            }
          : {
              type: 'name',
              isReadOnly: true,
              isExecutable: true,
              name: first
            }
    };
  }
  let endPos = pos + 1;
  const second = source[endPos];
  assert(second !== undefined);
  if (first === second && '<>'.includes(first)) {
    return {
      endPos: endPos + 1,
      value: {
        type: 'name',
        isReadOnly: true,
        isExecutable: true,
        name: first === '<' ? '<<' : '>>'
      }
    };
  }
  while (endPos < length) {
    const char = source[endPos];
    assert(char !== undefined);
    if (' \t\r\n%[]{}«»<>'.includes(char)) {
      break;
    }
    ++endPos;
  }
  return {
    endPos,
    value:
      first === '/'
        ? {
            type: 'name',
            isReadOnly: true,
            isExecutable: false,
            name: source.slice(pos + 1, endPos)
          }
        : {
            type: 'name',
            isReadOnly: true,
            isExecutable: true,
            name: source.slice(pos, endPos)
          }
  };
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
    let parsed: Parsed;
    if (char === '"') {
      parsed = parseString(source, pos);
    } else if ('-+0123456789'.includes(char)) {
      parsed = parseNumber(source, pos);
    } else {
      parsed = parseName(source, pos);
    }
    const length = parsed.endPos - pos;
    yield filename === undefined
      ? parsed.value
      : Object.assign({
          debugSource: {
            source,
            filename,
            pos,
            length
          },
          ...parsed.value
        });
    pos = parsed.endPos;
  }
}
