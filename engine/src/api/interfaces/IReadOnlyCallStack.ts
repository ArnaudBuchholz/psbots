import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';

export interface IReadOnlyCallStack extends IReadOnlyArray {
  readonly topOperatorState: number;

  /** Number.POSITIVE_INFINITY if index is out of range */
  operatorStateAt: (index: number) => number;
}
