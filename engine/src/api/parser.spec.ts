import { describe, it, expect } from 'vitest';
import { parse } from '@api/parser.js';
import type { Value } from '@api/values/Value.js';
import { nullValue } from '@api/values/NullValue.js';
import { toValue } from '@test/index.js';

it('handles an empty string', () => {
  expect([...parse('')]).toStrictEqual<Value[]>([]);
});

it('extracts a string', () => {
  expect([...parse('"test"')]).toStrictEqual<Value[]>([toValue('test')]);
});

it('extracts an integer', () => {
  expect([...parse('123')]).toStrictEqual<Value[]>([toValue(123)]);
});

it('extracts a negative integer', () => {
  expect([...parse('-123')]).toStrictEqual<Value[]>([toValue(-123)]);
});

it('extracts a positive integer', () => {
  expect([...parse('+123')]).toStrictEqual<Value[]>([toValue(123)]);
});

it('extracts an executable name', () => {
  expect([...parse('test')]).toStrictEqual<Value[]>([toValue(Symbol.for('test'), { isExecutable: true })]);
});

it('extracts an executable name (empty)', () => {
  expect([...parse('/')]).toStrictEqual<Value[]>([toValue(Symbol.for(''), { isExecutable: true })]);
});

it('extracts a name', () => {
  expect([...parse('/test')]).toStrictEqual<Value[]>([toValue(Symbol.for('test'))]);
});

it('extracts a name (+)', () => {
  expect([...parse('/+')]).toStrictEqual<Value[]>([toValue(Symbol.for('+'))]);
});

it('extracts a name (1)', () => {
  expect([...parse('/1')]).toStrictEqual<Value[]>([toValue(Symbol.for('1'))]);
});

describe('should include debugging information', () => {
  it('in a string', () => {
    expect([...parse('"test"', { pos: 0, filename: 'file.ps' })]).toStrictEqual<Value[]>([
      {
        ...toValue('test'),
        debugSource: {
          filename: 'file.ps',
          pos: 0,
          length: 6,
          source: '"test"'
        }
      }
    ]);
  });

  it('in an integer', () => {
    expect([...parse('123', { pos: 0, filename: 'file.ps' })]).toStrictEqual<Value[]>([
      {
        ...toValue(123),
        debugSource: {
          filename: 'file.ps',
          pos: 0,
          length: 3,
          source: '123'
        }
      }
    ]);
  });

  it('in an executable name', () => {
    expect([...parse('abc', { pos: 0, filename: 'file.ps' })]).toStrictEqual<Value[]>([
      {
        ...toValue(Symbol.for('abc'), { isExecutable: true }),
        debugSource: {
          filename: 'file.ps',
          pos: 0,
          length: 3,
          source: 'abc'
        }
      }
    ]);
  });

  it('in a name', () => {
    expect([...parse('/abc', { pos: 0, filename: 'file.ps' })]).toStrictEqual<Value[]>([
      {
        ...toValue(Symbol.for('abc')),
        debugSource: {
          filename: 'file.ps',
          pos: 0,
          length: 4,
          source: '/abc'
        }
      }
    ]);
  });
});

it('filters out comments', () => {
  expect([
    ...parse(`% This is a comment 123
% This is another comment 456
789`)
  ]).toStrictEqual<Value[]>([toValue(789)]);
});

it('filters out comments (no value)', () => {
  expect([...parse('% This is a comment 123')]).toStrictEqual<Value[]>([]);
});

it('returns multiple values', () => {
  expect([...parse('1 2')]).toStrictEqual<Value[]>([toValue(1), toValue(2)]);
});

const name = (name: string) => toValue(Symbol.for(name), { isExecutable: true });

describe('handling of special characters', () => {
  it('isolates special characters from values (before / after)', () => {
    expect([...parse('[123]')]).toStrictEqual<Value[]>([name('['), toValue(123), name(']')]);
  });

  it('isolates special characters from values (inside)', () => {
    expect([...parse('a[b')]).toStrictEqual<Value[]>(['a', '[', 'b'].map((n) => name(n)));
  });

  it('isolates special characters individually (block)', () => {
    expect([...parse('{{}}')]).toStrictEqual<Value[]>(['{', '{', '}', '}'].map((n) => name(n)));
  });

  it('isolates special characters individually (array)', () => {
    expect([...parse('[[]]')]).toStrictEqual<Value[]>(['[', '[', ']', ']'].map((n) => name(n)));
  });

  it('isolates special characters individually (dictionary - unicode)', () => {
    expect([...parse('««»»')]).toStrictEqual<Value[]>(['«', '«', '»', '»'].map((n) => name(n)));
  });

  it('isolates special characters individually (dictionary - ascii)', () => {
    expect([...parse('<<<<>>>>')]).toStrictEqual<Value[]>(['<<', '<<', '>>', '>>'].map((n) => name(n)));
  });

  it('does not fail on +', () => {
    expect([...parse('+')]).toStrictEqual<Value[]>([name('+')]);
  });

  it('does not fail on -', () => {
    expect([...parse('-')]).toStrictEqual<Value[]>([name('-')]);
  });
});

describe('parsing errors', () => {
  it('fails on unterminated strings', () => {
    expect([...parse('"abc')]).toStrictEqual<Value[]>([nullValue]);
  });
});
