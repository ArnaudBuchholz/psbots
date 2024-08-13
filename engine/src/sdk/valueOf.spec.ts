import { it, expect } from 'vitest';
import { ValueType } from '@api/index.js';
import { valueOf } from '@sdk/valueOf.js';
import { toValue } from '@test/index.js';

it('destructures one parameter', () => {
  const [number] = valueOf<ValueType.integer>(toValue(1));
  expect(number).toStrictEqual(1);
});

it('destructures two parameters', () => {
  const [number, string] = valueOf<ValueType.integer, ValueType.string>(toValue(1), toValue('a'));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
});

it('destructures three parameters', () => {
  const [number, string, boolean] = valueOf<ValueType.integer, ValueType.string, ValueType.boolean>(toValue(1), toValue('a'), toValue(true));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
  expect(boolean).toStrictEqual(true);
});

it('destructures four parameters', () => {
  const [number, string, boolean, array] = valueOf<ValueType.integer, ValueType.string, ValueType.boolean, ValueType.array>(toValue(1), toValue('a'), toValue(true), toValue([1, 'a', true]));
  expect(number).toStrictEqual(1);
  expect(string).toStrictEqual('a');
  expect(boolean).toStrictEqual(true);
  [1, 'a', true].forEach((value, index) => expect(array.at(index)).toStrictEqual(toValue(value)));
});
