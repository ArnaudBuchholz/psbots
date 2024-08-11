import type { IDictionary } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

/** Call stack, top parameters exposed through IDictionary */
export interface ICallStack extends IStack, IDictionary {}
