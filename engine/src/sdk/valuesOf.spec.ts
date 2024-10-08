import { it, expect } from 'vitest';
import type { ValueType } from '@api/index.js';
import { valuesOf } from './valuesOf.js';
import type { IFunctionOperator } from '@sdk/interfaces/IOperator.js';
import { toValue, values } from '@test/index.js';

it('destructures one parameter', () => {
  const [number] = valuesOf<ValueType.integer>(toValue(1));
  expect(number).toStrictEqual(1);
});

it('destructures two parameters', () => {
  const [number, string] = valuesOf<ValueType.integer, ValueType.string>(toValue(1), toValue('a'));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
});

it('destructures three parameters', () => {
  const [number, string, boolean] = valuesOf<ValueType.integer, ValueType.string, ValueType.boolean>(
    toValue(1),
    toValue('a'),
    toValue(true)
  );
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
  expect(boolean).toStrictEqual(true);
});

it('destructures four parameters', () => {
  const [number, string, boolean, array] = valuesOf<
    ValueType.integer,
    ValueType.string,
    ValueType.boolean,
    ValueType.array
  >(toValue(1), toValue('a'), toValue(true), toValue([1, 'a', true]));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
  expect(boolean).toStrictEqual(true);
  [1, 'a', true].forEach((value, index) => expect(array.at(index)).toStrictEqual(toValue(value)));
});

it('destructures a mark', () => {
  const [mark] = valuesOf<ValueType.mark>(toValue.mark);
  expect(mark).toStrictEqual(null);
});

it('destructures an operator', () => {
  const [operator] = valuesOf<ValueType.operator>(toValue(values.emptyFunction));
  expect(operator.name === 'emptyFunction');
  expect((operator as IFunctionOperator).implementation === values.emptyFunction);
});

it('destructures a dictionary', () => {
  const [dictionary] = valuesOf<ValueType.dictionary>(toValue({ abc: 123 }));
  expect(dictionary.lookup('abc')).toStrictEqual(toValue(123));
});
