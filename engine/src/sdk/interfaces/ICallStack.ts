import type { IDictionary } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

/**
 * Operator will be popped after being called,
 * set OPERATOR_STATE to a value > 0 to prevent the behavior.
 * Set it back to OPERATOR_STATE_POP to restore the behavior.
 */
export const OPERATOR_STATE_POP = 0;

/**
 * Operator is triggered one last time before popping,
 * OPERATOR_STATE cannot be changed anymore.
 */
export const OPERATOR_STATE_CALL_BEFORE_POP = -1;

/**
 * Operator has been called before popping,
 * OPERATOR_STATE cannot be changed anymore.
 */
export const OPERATOR_STATE_CALLED_BEFORE_POP = -2;

/** Call stack, top parameters exposed through IDictionary */
export interface ICallStack extends IStack, IDictionary {
  topOperatorState: number;
}
