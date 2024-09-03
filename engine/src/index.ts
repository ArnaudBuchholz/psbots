import type { IState } from '@api/interfaces/IState.js';
import type { StateFactorySettings } from '@core/state/State.js';
import { State } from '@core/state/State.js';

export { StateFactorySettings } from '@core/state/State.js';
export * from 'api/index.js';

/** State factory */
export function createState(settings?: StateFactorySettings): IState {
  return new State(settings);
}
