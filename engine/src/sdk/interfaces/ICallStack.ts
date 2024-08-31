import type { IDictionary } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export const STEP_DONE = Number.POSITIVE_INFINITY;
export const STEP_POP = Number.NEGATIVE_INFINITY;

/** Call stack, top parameters exposed through IDictionary */
export interface ICallStack extends IStack, IDictionary {
  /**
   * To be used by operators requiring multiple cycles.
   * When step is set (whatever the number), parameters are no more passed !
   * (use the IDictionary interface to store / retrieve values)
   */
  step: number | undefined;
}
