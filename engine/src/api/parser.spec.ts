import { describe, it, expect } from 'vitest';
import { parse } from '@api/parser.js';
import type { Value } from '@api/values/Value.js';
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

it('extracts an executable name', () => {
  expect([...parse('/')]).toStrictEqual<Value[]>([toValue(Symbol.for(''), { isExecutable: true })]);
});

it('extracts a name', () => {
  expect([...parse('/test')]).toStrictEqual<Value[]>([toValue(Symbol.for('test'))]);
});

it('should include debugging information', () => {
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

it('filters out comments', () => {
  expect([
    ...parse(`% This is a comment 123
% This is another comment 456
789`)
  ]).toStrictEqual<Value[]>([toValue(789)]);
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
});
