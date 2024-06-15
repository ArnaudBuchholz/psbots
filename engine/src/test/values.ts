const positiveIntegers = [0, 1, 10, 100];
const negativeIntegers = [-1, -10, -100];
const positiveFloats = [0.5, Math.PI];
const negativeFloats = [-0.5, -Math.PI];

const emptyFunction = function (): void {};
const emptyArrow = (): void => {};
const emptyGeneratorFunction = function* (): Generator<void> {};

export const values = {
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
  emptyFunction,
  emptyArrow,
  emptyGeneratorFunction,
  functions: [emptyFunction, emptyArrow, emptyGeneratorFunction]
};
