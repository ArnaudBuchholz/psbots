import { describe, beforeAll, it, expect } from 'vitest'
import { ExceptionDictionaryName, type Value } from '@api/index.js'
import { BaseException } from './BaseException.js'

describe('error behavior', () => {
  let exception: BaseException

  beforeAll(() => {
    exception = new BaseException('test')
  })

  it('exposes name', () => {
    expect(exception.name).toStrictEqual('BaseException')
  })

  it('exposes message', () => {
    expect(exception.message).toStrictEqual('test')
  })

  it('exposes stack', () => {
    expect(exception.stack).toBeTypeOf('string')
    expect(exception.stack).not.toBe('')
  })
})

describe('IReadOnlyDictionary behavior', () => {
  let exception: BaseException

  beforeAll(() => {
    exception = new BaseException('test')
  })
  
 
  it('exposes names', () => {
    expect(exception.names).toStrictEqual([
      ExceptionDictionaryName.type,
      ExceptionDictionaryName.name,
      ExceptionDictionaryName.message,
      ExceptionDictionaryName.stack
    ])
  })

    function checkNonNull (value: Value | null): asserts value is Value {
      if (value === null) {
        throw new Error('Unexpected null value')
      }
    }

    it('exposes type', () => {
      const typeValue = error.lookup('type')
      checkNonNull(typeValue)
      checkStringValue(typeValue)
      expect(typeValue.string).toStrictEqual('system')
    })

    it('exposes name', () => {
      const nameValue = error.lookup('name')
      checkNonNull(nameValue)
      checkStringValue(nameValue)
      expect(nameValue.string).toStrictEqual('BaseError')
    })

    it('exposes message', () => {
      const messageValue = error.lookup('message')
      checkNonNull(messageValue)
      checkStringValue(messageValue)
      expect(messageValue.string).toStrictEqual('test')
    })

    it('exposes stack', () => {
      const stackValue = error.lookup('stack')
      checkNonNull(stackValue)
      checkStringValue(stackValue)
      expect(stackValue.string).toContain('BaseError.spec.ts')
    })

    it('returns null on any other property', () => {
      expect(error.lookup('unknown')).toBeNull()
    })
})

describe('stack handling', () => {
    it('maps default stack', () => {
      const error = new BaseError('test')
      const { callstack } = error
      expect(callstack).not.toContain('BaseError:')
      expect(callstack).toContain('BaseError.spec.ts')
    })

    it('always return a string', () => {
      const error = new BaseError('test')
      error.stack = undefined
      expect(error.callstack).toStrictEqual('')
    })

    it('offers a setter', () => {
      const error = new BaseError('test')
      error.callstack = 'abc'
      expect(error.callstack).toStrictEqual('abc')
    })

    it('can only be set once', () => {
      const error = new BaseError('test')
      error.callstack = 'abc'
      error.callstack = 'def'
      expect(error.callstack).toStrictEqual('abc')
    })
})
