import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';

export interface IReadOnlyCallStack extends IReadOnlyArray {
  /** 0 if index is out of range */
  operatorStateAt: (index: number) => number;
}
