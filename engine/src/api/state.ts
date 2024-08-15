import type { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary.js';
import type { IState } from '@api/interfaces/IState.js';
import { State } from '@core/state/State.js';

export interface StateFactorySettings {
  /** Augment the list of known names */
  hostDictionary?: IReadOnlyDictionary;
  /** Limit the maximum of memory allowed for the state */
  maxMemoryBytes?: number;
}

/** State factory */
export function createState(settings?: StateFactorySettings): IState {
  return new State(settings);
}
