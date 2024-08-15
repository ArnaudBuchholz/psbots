import type { IReadOnlyDictionary, Value } from '@api/index.js';
import { ShareableObject } from '@core/objects/ShareableObject.js';

export class SystemDictionary extends ShareableObject implements IReadOnlyDictionary {
  // region IReadOnlyDictionary

  get names(): string[] {
    return [];
  }

  lookup(/*name: string*/): Value | null {
    return null;
  }

  // endregion IReadOnlyDictionary

  protected _dispose(): void {}
}
