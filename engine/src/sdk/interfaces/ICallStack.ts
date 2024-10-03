import type { IDictionary } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

/** Default value for topOperatorState */
export const OPERATOR_STATE_UNKNOWN = Number.POSITIVE_INFINITY;

/**
 * First call of the operator (parameters are transmitted).
 * By default, operator is popped from the call stack after being called (or after subsequent calls are processed).
 * topOperatorState can be changed :
 * - any value > 0 : prevents the default behavior, operator keeps control on when it should be popped
 * - OPERATOR_STATE_POP : operator is popped on next cycle
 * - OPERATOR_STATE_CALL_BEFORE_POP : requests operator to be triggered during the popping cycle
 */
export const OPERATOR_STATE_FIRST_CALL = 0;

/**
 * Operator is called before popping, can be set when topOperatorState === OPERATOR_STATE_REQUEST_CALL_BEFORE_POP (done internally).
 * topOperatorState can be changed :
 * - any value < -1 : operator keeps control on when it should be popped
 * - OPERATOR_STATE_POP : operator is popped on next cycle
 */
export const OPERATOR_STATE_CALL_BEFORE_POP = -1;

/**
 * Operator will be popped on next cycle, can be set only of topOperatorState > 0.
 * Once set, topOperatorState cannot be changed anymore.
 */
export const OPERATOR_STATE_POP = Number.NEGATIVE_INFINITY;

/*
  stateDiagram-v2
    [*] --> OPERATOR_STATE_UNKNOWN
    OPERATOR_STATE_UNKNOWN --> OPERATOR_STATE_FIRST_CALL
    OPERATOR_STATE_FIRST_CALL: OPERATOR_STATE_FIRST_CALL(0)
    OPERATOR_STATE_FIRST_CALL --> OPERATOR_STATE_POP
    OPERATOR_STATE_FIRST_CALL --> 123
    123 --> 456
    456 --> 123
    456 --> OPERATOR_STATE_POP
    OPERATOR_STATE_CALL_BEFORE_POP: OPERATOR_STATE_CALL_BEFORE_POP(-1)
    456 --> OPERATOR_STATE_CALL_BEFORE_POP
    OPERATOR_STATE_FIRST_CALL --> OPERATOR_STATE_CALL_BEFORE_POP
    NEG_123: -123
    OPERATOR_STATE_CALL_BEFORE_POP --> NEG_123
    OPERATOR_STATE_CALL_BEFORE_POP --> OPERATOR_STATE_POP
    NEG_456: -456
    NEG_123 --> NEG_456
    NEG_456 --> NEG_123
    NEG_456 --> OPERATOR_STATE_POP
    OPERATOR_STATE_POP --> [*]
*/

/** Call stack, top parameters exposed through IDictionary */
export interface ICallStack extends IStack, IDictionary {
  topOperatorState: number;
}
