import { describe, it, expect } from 'vitest';
import { parse, ParserError } from './tokenizer.js';
import type { Parsed } from './tokenizer.js';
import { nullValue } from '@psbots/types';
import { toValue } from '@psbots/sdk';

it('handles an empty string', () => {
  expect([...parse('')]).toStrictEqual<Parsed[]>([]);
});

it('extracts a string', () => {
  expect([...parse('"test"')]).toStrictEqual<Parsed[]>([{ value: toValue('test'), offset: 0, length: 6 }]);
});

it('extracts an integer', () => {
  expect([...parse('123')]).toStrictEqual<Parsed[]>([{ value: toValue(123), offset: 0, length: 3 }]);
});

it('extracts a negative integer', () => {
  expect([...parse('-123')]).toStrictEqual<Parsed[]>([{ value: toValue(-123), offset: 0, length: 4 }]);
});

it('extracts a positive integer', () => {
  expect([...parse('+123')]).toStrictEqual<Parsed[]>([{ value: toValue(123), offset: 0, length: 4 }]);
});

it('extracts an executable name', () => {
  expect([...parse('test')]).toStrictEqual<Parsed[]>([
    { value: toValue(Symbol.for('test'), { isExecutable: true }), offset: 0, length: 4 }
  ]);
});

it('extracts an executable name (empty)', () => {
  expect([...parse('/')]).toStrictEqual<Parsed[]>([
    { value: toValue(Symbol.for(''), { isExecutable: true }), offset: 0, length: 1 }
  ]);
});

it('extracts a name', () => {
  expect([...parse('/test')]).toStrictEqual<Parsed[]>([{ value: toValue(Symbol.for('test')), offset: 0, length: 5 }]);
});

it('extracts a name (+)', () => {
  expect([...parse('/+')]).toStrictEqual<Parsed[]>([{ value: toValue(Symbol.for('+')), offset: 0, length: 2 }]);
});

it('extracts a name (1)', () => {
  expect([...parse('/1')]).toStrictEqual<Parsed[]>([{ value: toValue(Symbol.for('1')), offset: 0, length: 2 }]);
});

it('filters out comments', () => {
  expect([
    ...parse(`% This is a comment 123
% This is another comment 456
789`)
  ]).toStrictEqual<Parsed[]>([{ value: toValue(789), offset: 54, length: 3 }]);
});

it('filters out comments (no value)', () => {
  expect([...parse('% This is a comment 123')]).toStrictEqual<Parsed[]>([]);
});

it('returns multiple values', () => {
  expect([...parse('1 2')]).toStrictEqual<Parsed[]>([
    { value: toValue(1), offset: 0, length: 1 },
    { value: toValue(2), offset: 2, length: 1 }
  ]);
});

const name = (name: string) => toValue(Symbol.for(name), { isExecutable: true });

describe('handling of special characters', () => {
  it('isolates special characters from values (before / after)', () => {
    expect([...parse('[123]')]).toStrictEqual<Parsed[]>([
      { value: name('['), offset: 0, length: 1 },
      { value: toValue(123), offset: 1, length: 3 },
      { value: name(']'), offset: 4, length: 1 }
    ]);
  });

  it('isolates special characters from values (inside)', () => {
    expect([...parse('a[b')]).toStrictEqual<Parsed[]>(
      ['a', '[', 'b'].map((n, offset) => ({ value: name(n), offset, length: 1 }))
    );
  });

  it('isolates special characters individually (block)', () => {
    expect([...parse('{{}}')]).toStrictEqual<Parsed[]>(
      ['{', '{', '}', '}'].map((n, offset) => ({ value: name(n), offset, length: 1 }))
    );
  });

  it('isolates special characters individually (array)', () => {
    expect([...parse('[[]]')]).toStrictEqual<Parsed[]>(
      ['[', '[', ']', ']'].map((n, offset) => ({ value: name(n), offset, length: 1 }))
    );
  });

  it('isolates special characters individually (dictionary - unicode)', () => {
    expect([...parse('««»»')]).toStrictEqual<Parsed[]>(
      ['«', '«', '»', '»'].map((n, offset) => ({ value: name(n), offset, length: 1 }))
    );
  });

  it('isolates special characters individually (dictionary - ascii)', () => {
    expect([...parse('<<<<>>>>')]).toStrictEqual<Parsed[]>(
      ['<<', '<<', '>>', '>>'].map((n, index) => ({ value: name(n), offset: 2 * index, length: 2 }))
    );
  });

  it('does not fail on +', () => {
    expect([...parse('+')]).toStrictEqual<Parsed[]>([{ value: name('+'), offset: 0, length: 1 }]);
  });

  it('does not fail on -', () => {
    expect([...parse('-')]).toStrictEqual<Parsed[]>([{ value: name('-'), offset: 0, length: 1 }]);
  });
});

describe('parsing errors', () => {
  it('fails on unterminated strings', () => {
    try {
      [...parse('"abc')];
      expect.unreachable();
    } catch (error) {
      expect.assert(error instanceof ParserError);
      expect(error.offset).toBe(0);
    }
  });
});
