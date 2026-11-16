// import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';
// import type { IMemoryTracker } from '@api/interfaces/IMemoryTracker.js';
// import type { IReadOnlyCallStack } from '@api/interfaces/IReadOnlyCallStack.js';
// import type { Value } from '@api/values/Value.js';
// import type { Exception } from '@api/Exception.js';
// import type { Result } from '@api/Result.js';

import { ICallStack, IDictionaryStack, IOperandStack } from "../../../engine/src/sdk";

// Should be introduced as a compatibility layer
type usize = number & { _brand: 'usize' };
type i8 = number & { _brand: 'byte' };
type i16 = number & { _brand: 'word' };
type i32 = number & { _brand: 'dword' };
type i64 = number & { _brand: 'qword' };

export const OPERANDS_STACK_HANDLE = 0;
export const CALLS_STACK_HANDLE = 1;
export const DICTIONARY_STACK_HANDLE = 2;

/** Public version of the engine state */
export interface IState {
  // --- memory related

  /* total state size */
  readonly size: usize;
  /* maintained free memory, does not account for fragmentation */
  readonly free: usize;
  /* handle table size */
  readonly handleTableSize: i32;

  // input


  // --- output
  
  readonly idle: i8;
  readonly callEnabled: i8;
  readonly halted: i8;


  // 
  readonly operands: IOperandStack;
  readonly callStack: ICallStack;
  readonly dictionaryStack: IDictionaryStack;

  /** Set when an exception is raised */
  readonly exception: Exception | undefined;
  readonly exceptionStack: IReadOnlyCallStack | undefined;
  /** Reset any exception, fails with invalidAccess if engine is not idle */
  exec: (value: Value) => Result<Generator, 'invalidAccess'>;
  /** Release associated memory, using the state *after* may fail */
  destroy: () => void;
}
