import type { Value } from '@psbots/types';
import { nullValue } from '@psbots/types';
import { assert } from '@psbots/sdk';

type ParseOptions = {
  pos?: number;
};

type EndPosAndValue = {
  endPos: number;
  value: Value;
};

export class ParserError extends Error {
  static override name = 'ParserError';

  #offset: number;

  get offset(): number {
    return this.#offset;
  }

  constructor(pos: number) {
    super(`Unable to parse source @${pos}`);
    this.#offset = pos;
  }
}

function parseString(source: string, pos: number): EndPosAndValue {
  const endPos = source.indexOf('"', pos + 1);
  if (endPos === -1) {
    throw new ParserError(pos);
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

function parseNumber(source: string, pos: number): EndPosAndValue {
  const first = source[pos];
  assert(first !== undefined);
  let endPos = pos + 1;
  // c is undefined if going over source length, undefined makes the following condition false
  let c = source[endPos]!;
  while (c >= '0' && c <= '9') {
    c = source[++endPos]!;
  }
  if (endPos === pos + 1 && (first === '+' || first === '-')) {
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

const ONE_CHAR_OLNY_NAMES = new Set('[]{}«»');
const NAME_DELIMITERS = new Set(' \t\r\n%[]{}«»<>');

function parseName(source: string, pos: number): EndPosAndValue {
  const { length } = source;
  const first = source[pos];
  assert(first !== undefined);
  if (ONE_CHAR_OLNY_NAMES.has(first)) {
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
      value: {
        type: 'name',
        isReadOnly: true,
        isExecutable: true,
        name: first === '/' ? '' : first
      }
    };
  }
  let endPos = pos + 1;
  const second = source[endPos];
  assert(second !== undefined);
  if (first === second && (first === '<' || first === '>')) {
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
    if (NAME_DELIMITERS.has(char)) {
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

const FORMATTING_CHARS = new Set(' \t\r\n');
const NUMBER_CHARS = new Set('+-1234567890');

export type Parsed = {
  value: Value;
  offset: number;
  length: number;
};

/** Returns nullValue if a syntax error is detected */
export function* parse(source: string, options?: ParseOptions): Generator<Parsed> {
  options ??= {};
  let { pos = 0 } = options;
  const { length } = source;
  while (pos < length) {
    const char = source[pos];
    assert(char !== undefined);
    if (FORMATTING_CHARS.has(char)) {
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
    let parsed: EndPosAndValue;
    if (char === '"') {
      parsed = parseString(source, pos);
    } else if (NUMBER_CHARS.has(char)) {
      parsed = parseNumber(source, pos);
    } else {
      parsed = parseName(source, pos);
    }
    const length = parsed.endPos - pos;
    yield { value: parsed.value, offset: pos, length };
    pos = parsed.endPos;
  }
}
