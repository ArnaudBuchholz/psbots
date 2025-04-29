import { it, expect } from 'vitest';
import { ValueType } from '@api/index.js';
import { SystemDictionary } from './System.js';

it('always return the same instance', () => {
  expect(SystemDictionary.instance).toStrictEqual(SystemDictionary.instance);
});

it('returns names', () => {
  const { names } = SystemDictionary.instance;
  expect(names).toBeInstanceOf(Array);
  expect(names.length).toBeGreaterThan(0);
});

it('does not fail on lookup', () => {
  expect(() => SystemDictionary.instance.lookup('--unknown--')).not.toThrowError();
});

it('returns mark', () => {
  const mark = SystemDictionary.instance.lookup('mark');
  if (mark === null) {
    throw new Error('Unexpected null when getting mark');
  }
  if (mark.type !== 'operator') {
    throw new Error('mark should be an operator');
  }
  expect(mark.operator.name).toStrictEqual('mark');
});

it('only returns operators', () => {
  for (const name of SystemDictionary.instance.names) {
    const operator = SystemDictionary.instance.lookup(name);
    if (operator === null) {
      throw new Error(`Unexpected null when getting ${name}`);
    }
    if (operator.type !== 'operator') {
      throw new Error(`${name} should be an operator`);
    }
    expect(operator.operator.name).toStrictEqual(name);
  }
});
