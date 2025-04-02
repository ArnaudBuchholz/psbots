import { ValueType } from '@api/values/ValueType.js';
import type { Value } from '@api/values/Value.js';
import { nullValue } from './values';
import { assert } from '@sdk/assert';

type ParseOptions = {
  pos?: number;
  filename?: string;
  // TODO: syntax switch to enable real PostScript parsing
};

type ParseOptionsWithSource = ParseOptions & Required<Pick<ParseOptions, 'pos'>> & {
  source: string;
};

type AddDebugSourceOptions = ParseOptionsWithSource & {
  length: number;
}

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

function * parseString(options: ParseOptionsWithSource) {
  const { source, pos } = options;
  // TODO: implement escaping with \
  const endPos = source.indexOf('"', pos + 1);
  if (endPos === -1) {
    yield addDebugSource(nullValue, { ...options, length: 1 });
    return source.length;
  }
  yield addDebugSource({
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: false,
    string: source.slice(pos + 1, endPos - pos - 1)
  }, { ...options, length: endPos - pos + 1 });
  return endPos + 1;
}

function * parseNumber(options: ParseOptionsWithSource) {
  const { source, pos } = options;
  let endPos = pos + 1;
  while (endPos < source.length && '0123456789'.includes(source[endPos]!)) {
    ++endPos;
  }
  if (endPos === pos + 1) {
    yield addDebugSource(nullValue, { ...options, length: 1 });
    return source.length;
  }
  yield addDebugSource({
    type: ValueType.integer,
    isReadOnly: true,
    isExecutable: false,
    integer: Number.parseInt(source.slice(pos, endPos - pos))
  }, { ...options, length: endPos - pos + 1 });
  return endPos + 1; // TODO: what if going beyond end of string ?
}

function * parseCall(options: ParseOptionsWithSource) {
  const { source, pos } = options;
  const header = source[pos];
  assert(header !== undefined);
  if ('[]{}«»'.includes(header)) {
    yield addDebugSource({
      type: ValueType.string,
      isReadOnly: true,
      isExecutable: true,
      string: header
    }, { ...options, length: 1 });
    return pos + 1;
  }
  if (pos === source.length - 1) {
    if (header === '/') {
      yield addDebugSource({
        type: ValueType.string,
        isReadOnly: true,
        isExecutable: true,
        string: ''
      }, { ...options, length: 1 });
    } else {
      yield addDebugSource({
        type: ValueType.string,
        isReadOnly: true,
        isExecutable: true,
        string: header
      }, { ...options, length: 1 });
   }
  }
  // << >>

  return pos;
}

/** Returns nullValue if a syntax error is detected */
export function* parse(source: string, options?: ParseOptions): Generator<Value> {
  options = options ?? {};
  const { filename } = options;
  let { pos = 0 } = options;
  const { length } = source;

  do {
    const char = source[pos];
    assert(char !== undefined);
    if (' \t\r\n'.includes(char)) {
      continue;
    }
    if (char === '%') {
      pos = source.indexOf('\n', pos);
      if (pos === -1) {
        return;
      }
      continue;
    }
    if (char === '"') {
      pos = yield * parseString({ source, filename, pos });
    } else if ('-+0123456789'.includes(char)) {
      pos = yield * parseNumber({ source, filename, pos });
    } else {
      pos = yield * parseCall({ source, filename, pos });
    }
  } while (++pos < length) {
}
