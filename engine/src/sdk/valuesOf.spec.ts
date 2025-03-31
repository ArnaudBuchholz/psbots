import { it, expect } from 'vitest';
import { markValue, nullValue } from '@api/index.js';
import type { ValueType } from '@api/index.js';
import { valuesOf } from './valuesOf.js';
import type { IFunctionOperator } from '@sdk/interfaces/IOperator.js';
import { toValue, values } from '@test/index.js';

it('handles one parameter', () => {
  const [number] = valuesOf<ValueType.integer>(toValue(1));
  expect(number).toStrictEqual(1);
});

it('handles two parameters', () => {
  const [number, string] = valuesOf<ValueType.integer, ValueType.string>(toValue(1), toValue('a'));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
});

it('handles three parameters', () => {
  const [number, string, boolean] = valuesOf<ValueType.integer, ValueType.string, ValueType.boolean>(
    toValue(1),
    toValue('a'),
    toValue(true)
  );
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
  expect(boolean).toStrictEqual(true);
});

it('handles four parameters', () => {
  const [number, string, boolean, array] = valuesOf<
    ValueType.integer,
    ValueType.string,
    ValueType.boolean,
    ValueType.array
  >(toValue(1), toValue('a'), toValue(true), toValue([1, 'a', true]));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
  expect(boolean).toStrictEqual(true);
  let index = 0;
  for (const value of [1, 'a', true]) {
    expect(array.at(index)).toStrictEqual(toValue(value));
    ++index;
  }
});

it('handles null', () => {
  const [value] = valuesOf<ValueType.null>(nullValue);
  expect(value).toStrictEqual(null);
});

it('handles mark', () => {
  const [value] = valuesOf<ValueType.mark>(markValue);
  expect(value).toStrictEqual(null);
});

it('handles an operator', () => {
  const [operator] = valuesOf<ValueType.operator>(toValue(values.emptyFunction));
  expect(operator.name).toStrictEqual('emptyFunction');
  expect((operator as IFunctionOperator).implementation).toStrictEqual(values.emptyFunction);
});

it('handles a dictionary', () => {
  const [dictionary] = valuesOf<ValueType.dictionary>(toValue({ abc: 123 }));
  expect(dictionary.lookup('abc')).toStrictEqual(toValue(123));
});
