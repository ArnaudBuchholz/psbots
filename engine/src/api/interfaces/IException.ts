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

export interface IException extends Error, IReadOnlyDictionary {
  readonly type: ExceptionType;
  readonly engineStack: string[];
}
