import type { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary.js';

export enum ExceptionDictionaryName {
  type = 'type',
  name = 'name',
  message = 'message',
  stack = 'stack'
}

export enum ExceptionType {
  system = 'system',
  custom = 'custom'
}

export enum SystemExceptionName {
  break = 'break',
  busy = 'busy',
  dictStackUnderflow = 'dictStackUnderflow',
  invalidAccess = 'invalidAccess',
  invalidBreak = 'invalidBreak',
  rangeCheck = 'rangeCheck',
  stackUnderflow = 'stackUnderflow',
  typeCheck = 'typeCheck',
  undefined = 'undefined',
  unmatchedMark = 'unmatchedMark',
  vmError = 'vmError'
}

export interface IException extends Error, IReadOnlyDictionary {
  readonly type: ExceptionType;
}
