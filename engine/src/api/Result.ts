import type { Exception } from './Exception.js';

export type Result<V = undefined, E extends Exception = Exception> =
  | {
      success: false;
      exception: E;
    }
  | {
      success: true;
      value: V;
    };
