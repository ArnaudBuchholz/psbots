import type { IDictionary } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

/** Default value for topOperatorState */
export const OPERATOR_STATE_UNKNOWN = Number.POSITIVE_INFINITY;

/**
 * First call of the operator (parameters are transmitted).
 * By default, operator is popped from the call stack after being called (or after subsequent calls are processed).
 * topOperatorState can be changed :
 * - any value > 0 : prevents the default behavior, operator keeps control on when it should be popped
 * - OPERATOR_STATE_POP : operator is popped on next cycle (can be set only if value > 0)
 * - OPERATOR_STATE_REQUEST_CALL_BEFORE_POP : requests operator to be triggered one last time *just* before popping
 */
export const OPERATOR_STATE_FIRST_CALL = 0;

/**
 * Operator will be popped on next cycle, can be set only of topOperatorState > 0.
 * Once set, topOperatorState cannot be changed anymore.
 */
export const OPERATOR_STATE_POP = -1;

/**
 * Request operator to be triggered one last time *just* before popping, can be set when topOperatorState >= 0.
 * Once set, topOperatorState cannot be changed anymore.
 */
export const OPERATOR_STATE_REQUEST_CALL_BEFORE_POP = -2;

/**
 * Operator is called before popping, can be set when topOperatorState === OPERATOR_STATE_REQUEST_CALL_BEFORE_POP (done internally).
 * Once set, topOperatorState cannot be changed anymore.
 */
export const OPERATOR_STATE_CALL_BEFORE_POP = -3;

/** Call stack, top parameters exposed through IDictionary */
export interface ICallStack extends IStack, IDictionary {
  topOperatorState: number;
}
