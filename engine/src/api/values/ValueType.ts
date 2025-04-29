/** Possible Value types */
export const VALUE_TYPE = {
  null: 0,
  boolean: 1,
  integer: 2,
  string: 3,
  name: 4,
  mark: 5,
  operator: 6,
  array: 7,
  dictionary: 8
} as const;

export type ValueType = keyof typeof VALUE_TYPE;
