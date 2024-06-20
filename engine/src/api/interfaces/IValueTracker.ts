import type { Value } from '@api/values/Value.js';

export interface IValueTracker {
  addValueRef: (value: Value) => void;
  releaseValue: (value: Value) => void;
};  
  