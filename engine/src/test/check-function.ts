import { it, expect } from 'vitest'
import { stringify } from '@test/stringify.js'

export const positiveIntegers = [0, 1 ,10, 100]
export const negativeIntegers = [-1 ,-10, -100]
export const positiveFloats = [0.5, Math.PI]
export const negativeFloats = [-0.5, -Math.PI]
export const numbers = [...positiveIntegers, ...negativeIntegers, ...positiveFloats, ...negativeFloats, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]

export const emptyFunction = function () {}
export const emptyArrow = () => {}
export const emptyGeneratorFunction = function * () {}
export const functions = [emptyFunction, emptyArrow, emptyGeneratorFunction]

export function testCheckFunction<T> ({
  check,
  valid,
  invalid
}: {
  check: (value: unknown) => void
  valid: T[]
  invalid: any[]
}) {
  valid.forEach(value => it(`validates ${stringify(value)}`, () => expect(check(value)).not.toThrowError()))
  invalid.forEach(value => it(`rejects ${stringify(value)}`, () => expect(check(value)).toThrowError()))
}
