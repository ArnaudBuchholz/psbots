import type { Value, ValueOf, ValueType } from '@api/index.js';

const values: { [type in ValueType]: (value: Value<type>) => unknown } = {
  null: () => null,
  boolean: (value) => value.isSet,
  integer: (value) => value.integer,
  string: (value) => value.string,
  name: (value) => value.name,
  mark: () => null,
  operator: (value) => value.operator,
  array: (value) => value.array,
  dictionary: (value) => value.dictionary
};

function getValueOf(value: Value): unknown {
  return values[value.type](value as never);
}

export function valuesOf<T1>(value1: Value<T1>): [ValueOf<T1>];
export function valuesOf<T1, T2>(value1: Value<T1>, value2: Value<T2>): [ValueOf<T1>, ValueOf<T2>];
export function valuesOf<T1, T2, T3>(
  value1: Value<T1>,
  value2: Value<T2>,
  value3: Value<T3>
): [ValueOf<T1>, ValueOf<T2>, ValueOf<T3>];
export function valuesOf<T1, T2, T3, T4>(
  value1: Value<T1>,
  value2: Value<T2>,
  value3: Value<T3>,
  value4: Value<T4>
): [ValueOf<T1>, ValueOf<T2>, ValueOf<T3>, ValueOf<T4>];
export function valuesOf(...values: Value[]): unknown[] {
  return values.map((value) => getValueOf(value));
}
