import type { IArray } from './IArray.js';

export interface ICallStack extends IArray {
  readonly topOperatorState: number;

  /** Number.POSITIVE_INFINITY if index is out of range */
  operatorStateAt: (index: number) => number;
}
