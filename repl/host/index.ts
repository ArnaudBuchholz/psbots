import type { Value, IReadOnlyDictionary } from '@psbots/engine';
import type { IReplIO } from '../IReplIO.js';
import { exit } from './exit.js';
import { createStateOperator } from './state.js';
import { createHelpOperator } from './help.js';
import { createPstackOperator } from './pstack.js';
import { debug } from './debug.js';

export function createHostDictionary(replIO: IReplIO): IReadOnlyDictionary {
  const hostMappings: Record<string, Value> = {
    exit,
    state: createStateOperator(replIO),
    help: createHelpOperator(replIO),
    pstack: createPstackOperator(replIO),
    debug
  };

  return {
    get names() {
      return Object.keys(hostMappings);
    },

    lookup(name: string): Value | null {
      return hostMappings[name] ?? null;
    }
  };
}
