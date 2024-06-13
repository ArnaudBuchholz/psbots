import { it, expect } from 'vitest'
import { InternalException } from '@sdk/exceptions/InternalException.js'

it('prevents the stack override', () => {
  const exception = new InternalException('message')
  exception.stack = 'something'
  expect(exception.stack).not.toStrictEqual('something')
})
