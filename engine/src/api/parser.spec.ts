import { it, expect } from 'vitest'
import { parse } from '@api/parser.js'
import type { Value } from '@api/values/Value.js'
import { ValueType } from '@api/values/ValueType.js'

it('handles an empty string', () => {
  expect([...parse('')]).toStrictEqual<Value[]>([])
})

it('extracts a string', () => {
  expect([...parse('"test"')]).toStrictEqual<Value[]>([{
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: false,
    isShared: false,
    string: 'test'
  }])
})

it('extracts an integer', () => {
  expect([...parse('123')]).toStrictEqual<Value[]>([{
    type: ValueType.integer,
    isReadOnly: true,
    isExecutable: false,
    isShared: false,
    integer: 123
  }])
})

it('extracts a callable string', () => {
  expect([...parse('test')]).toStrictEqual<Value[]>([{
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: true,
    isShared: false,
    string: 'test'
  }])
})

it('should include debugging information', () => {
  expect([...parse('"test"', 0, 'file.ps')]).toStrictEqual<Value[]>([{
    type: ValueType.string,
    isReadOnly: true,
    isExecutable: false,
    isShared: false,
    debugSource: {
      filename: 'file.ps',
      pos: 0,
      length: 6,
      source: '"test"'
    },
    string: 'test'
  }])
})
