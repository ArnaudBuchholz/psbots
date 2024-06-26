const positiveIntegers = [0, 1, 10, 100];
const negativeIntegers = [-1, -10, -100];
const positiveFloats = [0.5, Math.PI];
const negativeFloats = [-0.5, -Math.PI];

const positiveBigints = positiveIntegers.map((i) => BigInt(i));
const negativeBigints = negativeIntegers.map((i) => BigInt(i));

const emptyFunction = function (): void {};
const emptyArrow = (): void => {};
const emptyGeneratorFunction = function* (): Generator<void> {};

export const values = {
  booleans: [false, true],

  positiveIntegers,
  negativeIntegers,
  positiveFloats,
  negativeFloats,
  numbers: [
    ...positiveIntegers,
    ...negativeIntegers,
    ...positiveFloats,
    ...negativeFloats,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ],

  strings: ['', 'Hello World !'],

  emptyObject: {},

  emptyFunction,
  emptyArrow,
  emptyGeneratorFunction,
  functions: [emptyFunction, emptyArrow, emptyGeneratorFunction],

  symbol: Symbol('symbol'),

  positiveBigints,
  negativeBigints,
  bigints: [...positiveBigints, ...negativeBigints],

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all: <any[]>[]
};

values.all = Object.values(values).flat();
