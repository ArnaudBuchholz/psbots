import type { IState } from '@api/interfaces/IState.js';
import type { OperatorDefinition } from '@core/operators/operators.js';
import type { StateFactorySettings } from '@core/state/State.js';
import { registry } from '@core/operators/operators.js';
import { State } from '@core/state/State.js';
import { Result } from '@api/Result.js';

export { StateFactorySettings } from '@core/state/State.js';
export * from './api/index.js';

/** State factory */
export function createState(settings?: StateFactorySettings): Result<IState> {
  return State.create(settings);
}

/** Operators registry */
export function getOperatorDefinitionRegistry(): { [name in string]: OperatorDefinition } {
  return Object.entries(registry).reduce(
    (result, [name, item]) => {
      result[name] = item.definition;
      return result;
    },
    {} as { [name in string]: OperatorDefinition }
  );
}
