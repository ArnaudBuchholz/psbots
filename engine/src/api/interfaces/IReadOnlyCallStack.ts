import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js';

export interface IReadOnlyCallStack extends IReadOnlyArray {
  operatorStateAt: (index: number) => number;
}
