import type { Value, IReadOnlyDictionary } from '@psbots/engine';
import { exit } from './exit.js';

const hostMappings: Record<string, Value> = {
  exit,
}

export const hostDictionary: IReadOnlyDictionary = {
  get names () {
    return Object.keys(hostMappings)
  },

  lookup (name: string): Value | null {
    return hostMappings[name] ?? null;
  }
}
