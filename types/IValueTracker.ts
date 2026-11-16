import type { Value } from '@api/values/Value.js';

export interface IValueTracker {
  /** ensures the value remains valid while holding it */
  addValueRef: (value: Value) => void;
  /** returns true if the value is still valid after releasing */
  releaseValue: (value: Value) => boolean;
}
