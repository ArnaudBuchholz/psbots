import type { Value, StringValue } from '@api/index.js'
import { ValueType } from '@api/index.js'
import { InternalException } from '@sdk/exceptions/InternalException.js'
import { isObject } from '@sdk/checks/isObject.js'

function check<T extends ValueType> (
  type: T,
  value: unknown,
  check: (value: Value<T>) => boolean
): void {
  if (!isObject(value) || value.type !== type || !check(value)) {
    throw new InternalException(`Not a ${type.charAt(0).toUpperCase()}${type.substring(1)}Value`)
  }
}

export function checkStringValue (value: unknown): asserts value is StringValue {
  check(ValueType.string, value, (value) => {
    const { string } = value
    return typeof string === 'string'
  })
}
