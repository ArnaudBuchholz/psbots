import type { IDictionary } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

/** Call stack, top parameters exposed through IDictionary */
export interface ICallStack extends IStack, IDictionary {
  /**
   * To be used by operators requiring multiple cycles.
   * When step is set (whatever the number), parameters are no more passed !
   * (use the IDictionary interface to store / retrieve values)
   */
  step: number | undefined;
}
